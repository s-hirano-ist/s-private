# RSSリーダー

既存Webの `/[locale]/rss`（未読）と `/[locale]/rss/saved`（保存済み）で、RSS 1.0（RDF）／RSS 2.0／Atomの購読、未読、あとで読むを管理する。
WebはServer Actionsと同一originのAPI proxy経由で生成clientを呼び、認証・所有者確認・取得・永続化は
共通backendの `/api/v1/rss` が担当する。既存Articlesの公開ライフサイクル、
RAG、iOSのdelta sync、MobileSyncChangeには参加しない。

上部ナビゲーションのトグルで未読・保存済みを切り替え、表示中の一覧の件数を表示する。
購読の追加・解除とInoreader取り込みは、設定の「RSSの購読管理」
（`/[locale]/settings/rss`）にまとめる。
件数は既読化・保存解除・フィード更新後にも同期する。
未読・保存済み・購読設定の初回表示には、Suspenseとroute loadingで共通の
読み込み表示を出す。一覧の再取得・保存操作中は一覧上部にインジケーターを表示し、
フィード取得中は完了件数も表示する。背景での取得を示す状態とページ操作の待機状態は分離する。

## 保存とライフサイクル

- `rss_feeds` は所有者別の購読、OPMLフォルダー、取得日時、HTTP validator、
  エラー状態、期限付きleaseを保存する。
- `rss_unread` は未読のURL・タイトル・公開日時・取得日時と、任意の記事画像URLを保存する。
  開く操作（通常クリック・中クリック）、一括既読で物理削除する。
- `rss_seen` は購読IDと取得済みGUID／Atom IDのSHA-256だけを残す。
  IDがない場合は記事URLを用い、同じフィード内の既読復活を防ぐ。
- `rss_saved` は未読と独立したURL・タイトル・公開日時・保存日時・任意の記事画像URLを保存する。
  URLは所有者ごとに一意で、既読化・購読解除でも残り、保存解除で物理削除する。

本文・画像データ・deleted flag・既読一覧・インポート原本は保存しない。
未読と保存記事の自動期限切れは設けない。購読解除ではその購読の未読とhashを
cascade削除する。再購読は初回取得として、現在のフィード内容を未読にする。
配信元がIDを変更した記事は再登場し得る。

## 記事カードとサムネイル

記事の個別既読ボタンは置かず、記事を開く操作と一括既読を使う。
保存・保存解除は星アイコンで切り替える。未読一覧の `savedId` は表示ページと独立して
所有者の保存リンクを検索するため、保存済み一覧の別ページにある記事も保存状態を示す。

フィードのMedia RSS thumbnail/content、画像enclosure、本文HTMLの最初の画像から
HTTPSの画像URLだけを抽出する。元のHTML・画像データは保存しない。
画像のない記事、画像読み込みに失敗した記事はタイトルだけで表示する。
既存の画像URLがない未読・保存記事は、手動更新時にフィードに残る同じURLの記事から補完する。
既読を復活させず、既存の画像URLを上書きしない。記事ページのOGP取得は行わない。

配信元・CDNが購読ごとに異なるため、Next.js ImageのHTTPS remotePatternsは全ホストを対象とする。
ローカルIPとSVGの最適化を禁止し、最大5 MB・リダイレクト3回に制限する。
ブラウザは同一originの画像最適化URLを読み込むため、CSPの画像接続先は増やさない。

## 取得

XMLの10進・16進数値文字参照（`&#27861;`、`&#x6CD5;`など）を記事名・購読名・
リンク属性で展開する。エスケープ済みの参照やCDATAの文字列は再展開しない。
DOCTYPE／ENTITY宣言の禁止と、展開後のURL検証は維持する。

RSS 1.0はRSS名前空間のchannelと、その兄弟itemを読み込む。記事IDにはRDF名前空間の
`about`属性、公開日時にはDublin Coreの`date`を使う。名前空間はURIで判定するため、
接頭辞の変更やRSS要素への接頭辞付与にも対応する。IDがない記事は従来どおりURLを使う。
RDFの本文・拡張要素・sequenceは保存せず、新着判定には使わない。

Vercel Schedulesの `rss-refresh` が毎時17分（UTC）を基準にproduction backendの
`GET /api/cron/rss-refresh` を呼ぶ。Hobbyの実行開始には最大15分のjitterがある。
最終試行から1時間以上経過しleaseが空いている購読を、
未取得・古い順に最大100件選び、最大5件まで並列取得する。所有者はDBから解決し、
個別取得は所有者のtenant context内で既存serviceを呼ぶ。ブラウザの認証cookieは使用しない。
1回240秒の処理予算のうち、残り30秒では次の購読を開始せず、未処理分を次回へ回す。
Schedulesの遅延・実行漏れや、前回取得完了から1時間未満の場合のskipがあるため、毎時の完了は保証しない。

Web・iOSから配信元の取得は開始しない。起動・画面復帰・更新ボタン・pull-to-refreshは
`GET /api/v1/rss` によるDB読取だけを行う。配信元の取得とDBへの反映は上記の
サーバーCronが担当し、画面を閉じても独立して実行される。購読追加・OPML取り込みも
購読をDBへ登録するまでとし、初回の記事取得は次のCronを待つ。
手動更新は配信元の強制取得を意味しない。既存の認証付きrefresh APIは管理・診断用として
維持し、Web・iOSのreader clientからは呼び出せない構成にする。

WebはSSRの初期データを表示し、表示中は60秒ごと、ウィンドウ復帰時にもDBを再取得する。
非表示中の定期読取は行わない。iOSは既存の5分間隔・foreground復帰時のDB同期を使う。
いずれも既存の記事・ページ・絞り込みを維持し、新着は「新着N件を表示」で通知する。
spinnerはDB読取の待機にだけ使用し、配信元の取得を待たない。

### 一覧APIと再取得

`GET /api/v1/rss` の `view` は `all`（既定）、`unread`、`saved`、`feeds`。
未指定のMCP呼び出しは従来どおり両一覧を取得する。Webは表示中のviewを指定し、
対象外の記事一覧は空配列、件数は0として返す。購読情報は全viewで返す。
未読の星状態は表示ページと独立して保存リンクを照合する。
未読のフィード絞り込みには `(user_id, feed_id, received_at, id)` の索引を使う。

SSRの初期データはhydration時に再取得しない。ファイル入力はhydration後に有効化し、
イベント処理の準備前に選んだファイルの取り込みが失われることを防ぐ。
準備状態には `useSyncExternalStore` のserver/client snapshotを使い、effect内の同期setStateを避ける。同一ページの背景再取得は同時に1件までとし、
取得中に増えた更新通知を最後の1回へまとめる。ページ・絞り込み変更は古い要求をabortし、
応答の識別でも古い結果の反映を防ぐ。

### 定期取得の設定と監視

backendは既存の `CRON_SECRET` と `BACKEND_CRON_ENABLED` で保護する。
スケジュールは `apps/backend/vercel.json` の `schedules.rss-refresh` に定義し、
GitHub Actionsの設定は不要とする。既存の日次Cronは `crons` のまま維持する。

1. backend projectのProduction環境に `CRON_SECRET`（16文字以上）と
   `BACKEND_CRON_ENABLED=true` を設定する。SchedulesがBearer認証を付けるため、
   secretをGitHubへ複製する必要はない。
2. 使用量を確認してからbackendをProductionへdeployする。新規static scheduleは
   Productionでは有効、Previewでは無効で作成される。Previewではscheduleを有効化せず、
   `BACKEND_CRON_ENABLED=false` も維持する。
3. Vercel Dashboardのbackend projectで **Schedules → rss-refresh → Run Schedule** を実行し、
   実行履歴・FunctionログとDBへの新着反映を確認する。未認証のAPI呼び出しは401になることも確認する。
4. Web・iOSのDB読取専用版を本番へ切り替える前に定期取得の動作を確認する。
   未設定のままでは既存DBの閲覧はできるが、購読追加後の初回取得や新着の取り込みは進まない。

停止時は **Schedules → rss-refresh → Disable** を使う。無効状態は以降のdeployでも維持される。
`BACKEND_CRON_ENABLED` は他のCronにも共通なので、RSSだけの停止には変更しない。
同じ `rss-refresh` を別のschedulerにも登録しない。重複配送や実行の重なりはbackendのleaseで保護する。
以前のGitHub設定 `RSS_BACKEND_URL`・`RSS_CRON_SECRET`・`RSS_CRON_ENABLED` がある場合は削除できる。

SchedulesはBeta。Hobbyでは最短15分間隔、jitterは15分固定で、手動実行を含む
team全体の実行上限は1請求期間5,000回となる。毎時実行は30日で720回だが、
他projectやPreviewで有効にしたscheduleの使用量も合算する。
仕様は [設定](https://vercel.com/docs/schedules/configuration)、
[環境と有効状態](https://vercel.com/docs/schedules/concepts)、
[Hobbyの制限](https://vercel.com/docs/schedules/limits) を参照する。

既存監視へ `rss.page.duration`、`rss.claim.duration`、`rss.fetch.duration`、
`rss.complete.duration` と、`rss.cron.duration`・`rss.cron.feeds` を記録する。
時間計測には記事URL・タイトル・ユーザー情報を含めない。Cron応答には
`processed`・`updated`・`failed`・`skipped`・`deferred` の件数を返す。
個別失敗は既存の診断へ送り、他の購読の取得を継続する。

100購読・30日では定期呼び出しは720回、最大72,000購読取得相当となる。
全応答が304でも、購読ごとのclaimとcommitのDB処理は必要である。
Functionの上限予算は720 × 240秒 = 48時間／月だが、これは課金額ではなく壁時計時間の上限目安。
RUはSQL回数と同一ではないため、productionの代表操作と定期取得の実測RU、
Function CPU・メモリー時間を月間へ換算し、既存使用量と合算してから有効にする。
無料枠超過が見込まれる場合は有効にせず、課金や取得頻度の自動変更は行わない。

通常取得はETag／Last-Modifiedによる条件付き取得を行い、304では未読・hashを変更しない。
手動更新ではvalidatorを送らず本文を再取得し、フィードに残っている記事について、
置換文字（U+FFFD）を含む既存の未読・保存タイトルを正常なタイトルで補正する。
数値文字参照が未展開の既存タイトルも、参照を含まない最新タイトルで補正する。
以前の512文字制限で参照途中まで切り詰められていた場合も最新タイトル全体を復元する。
現在の配信元が参照そのものを文字列として表示するタイトルは補正しない。
U+FFFDがない場合も、同じURLの正常なタイトルをUTF-8からLatin-1・Windows-1252・
Shift_JIS・EUC-JPとして誤読した結果と保存済みのタイトルが完全一致する場合に補正する。
保存時の512文字での切り詰めも比較に含める。文字の見た目だけでは判定せず、
更新時には読み取った元タイトルの一致も条件にして、並行した変更を上書きしない。
既読行は復活させず、正常なタイトル・保存記事のその他の情報も変更しない。
元のフィードから消えた記事、URLやID自体が壊れたデータ、上記の誤読結果と一致しない文字化けは
自動補正できない。購読解除や既読履歴のリセットで復旧する方式は使わない。

本文はXML解析前に文字コードを変換する。BOM、HTTP Content-Typeのcharset、XML宣言、
UTF-8既定の順に判定し、UTF-16のバイト順も確認する。Node.jsのTextDecoderを使い、
Shift_JIS／Windows-31J・EUC-JP等に対応する。不明な文字コードと不正なバイト列は
置換して保存せず、`stage=decode` と `unsupported_charset`／`invalid_text` で報告する。
[XML MIMEの優先順位](https://www.rfc-editor.org/rfc/rfc7303#section-3.2)に従い、
配信元の誤ったcharset宣言を推測で上書きしない。UTF-32は未対応。

レスポンスは2 MiB、取得は15秒、redirectは5回までに制限する。
HTTP(S)の公開IP・標準Webポートだけを許可し、DNS解決結果を実接続へ固定する。
redirect先も同様に検証する。XMLのDOCTYPE・ENTITYを拒否する。

購読単位の60秒leaseとtokenで並行取得と古い処理のcommitを防ぎ、
hash登録・未読作成・HTTP validator更新を同じトランザクションで確定する。
CockroachDBのserialization競合は既存のretry helperで再実行する。
失敗時は未読・hash・validatorを保持し、最終試行時刻と簡潔な失敗状態だけを更新する。

## 取得失敗の診断

RSS取得失敗は `source=rss_refresh` として、backendのVercel runtime logとSentryへ
同じ構造で記録する。DBにログ用テーブルや履歴は追加しない。Sentryへの送信は
既存のbackend設定を使い、失敗報告後に最大2秒のflushを待つ。

- `feedId` と `hostname`：購読IDと失敗時の接続先ホスト。redirect先で失敗した場合はそのホスト
- `stage`：`url`、`dns`、`http`、`body`、`decode`、`parse`、またはDB処理の `claim`、`complete`、`release`
- `reason`：HTTPエラー、timeout、SSRF拒否、非対応の圧縮、サイズ超過、XML不正、非対応フィード形式等
- `httpStatus`、許可リスト内の `networkCode`、Prisma形式の `storageCode`（取得できた場合）
- `durationMs`、`redirects`、`bytes`：失敗までの時間、redirect回数、受信本文バイト数

URLのpath・query・fragment、認証情報、記事本文、response header、元の例外やDB queryは
記録しない。取得時の情報がないDB claim失敗ではホスト名も記録しない。
報告先が停止してもleaseの解放を試み、他の購読の取得は継続する。DB自体のclaim・
解放失敗は、診断後に従来どおりHTTP層へ伝播する。

調査には既存のSentry／Vercel MCPを使う。追加のMCPサーバーや権限は不要。
Sentryのissue検索には `source:rss_refresh environment:production` を指定し、
必要に応じて `rss.stage:dns` や `rss.reason:http_status` で絞る。
issueのevent詳細に上記の診断情報が入る。Vercelではbackend projectのproductionを
対象に、`RSS refresh failed` でruntime logを検索する。保存期間内の直近の時間範囲を使う。

このログは改修の本番反映後の失敗から収集する。過去の `FETCH_FAILED` の原因は復元できない。
反映後にRSS画面の手動更新で再取得し（最短1分間隔）、記録された情報を調べる。

## Inoreaderからの移行

Preferences → Account → Export and backupで全アカウントのアーカイブを要求し、
ZIPを画面から選択する。OPML単独にはあとで読むは含まれない。
[Inoreaderの公式説明](https://www.inoreader.com/help/basic/preferences-customization/can-i-export-my-subscriptions-and-content)
を参照する。

ZIP内の `subscriptions.xml` と `starred.json` を対象とする。
単独のOPML／XML／starred.jsonも受け付ける。
starred.jsonはGoogle Reader互換の `items` 配列、または記事の配列に対応し、
URLはcanonical、alternate、urlの順で解決する。
タグ・ハイライト・本文・添付ファイル・保存Webページ専用ファイルは対象外。
元の保存日時がない場合を含め、保存日時は取り込み時刻とする。

ZIPはブラウザ内で展開し、入力50 MiB・対象ファイル展開合計32 MiB・
アーカイブ内1万ファイルまでに制限する。本文を除き、保存記事は100件ずつ送信する。
APIはJSON body 4 MiB、取り込みテキスト200万文字を上限とする。
取り込み結果は追加・重複・不正の件数を表示する。
途中失敗時は成功済みのデータを維持する。同じファイルを再実行して再開できる。
実ユーザーのエクスポートファイルでの最終互換確認は別途必要。

## 無料枠と計測

既存CockroachDB Basicに4テーブルを追加する。公表されている既存Basicの無料枠は
10 GiB・月5,000万RUであり、既存機能との合計で評価する。
[料金と適用対象クラスタの注記](https://www.cockroachlabs.com/cockroachdb/pricing/)を確認する。

容量の確認には、専用ローカルDBでmigrationを適用した後、次を実行する。
クラウド／既存開発DBを指定してはならない。

```sh
RSS_TEST_DATABASE_URL='postgresql://root@localhost:26257/rss_worktree_410f?sslmode=disable' \
  pnpm exec vp test run --project infrastructure packages/infrastructure/src/rss/repository.integration.test.ts
RSS_CAPACITY_REPORT=/tmp/rss-capacity.json \
RSS_CAPACITY_DATABASE_URL='postgresql://root@localhost:26257/rss_worktree_410f_capacity?sslmode=disable' \
  pnpm exec vp test run --project infrastructure packages/infrastructure/src/rss/capacity.integration.test.ts
cat /tmp/rss-capacity.json
```

容量テストは100購読・未読1万件・保存1万件・hash1万件を投入し、件数と
テーブル／索引を含む重複排除済みrange容量を出力する。検証データは終了時に削除する。
削除直後のMVCCデータはGCまで残るため、新規の専用DBで測定する。
この値はローカルの参考値であり、Cloudの課金容量・月間RUを保証しない。

本番有効化前にConsoleで既存使用量と上限設定を確認し、代表的な起動・取得・既読・
取り込み操作のRU増分を測定する。月間利用回数へ換算し、余裕を含めて無料枠内で
あることを確認する。無料枠を超える見込みなら定期取得頻度を変更したり課金を
有効にしたりせず、実測値を基に無料構成の再設計を行う。

### 一覧性能の再計測

専用ローカルDBでmigrationを適用後、以下を実行する。既存開発DB・クラウドDBは指定しない。
100購読・未読1万件・保存1万件を投入し、ウォームアップ後20回の中央値・p95・SQL回数・
JSONバイト数と、フィード絞り込みのEXPLAINを出力する。検証データは終了時に削除する。

```sh
RSS_PERFORMANCE_DATABASE_URL='postgresql://root@localhost:26257/rss_worktree_perf?sslmode=disable' \
RSS_PERFORMANCE_REPORT=/tmp/rss-performance.json \
  pnpm exec vp test run --project infrastructure packages/infrastructure/src/rss/performance.integration.test.ts
```

2026-11-17のローカル比較（接続プール3、変更前後とも新規専用DB）の参考値:

| 操作 | 変更前中央値 | 変更後中央値 | 変更前p95 | 変更後p95 |
| --- | --- | --- | --- | --- |
| 初回一覧 | 4.70 ms | 3.28 ms | 5.24 ms | 3.81 ms |
| 次ページ | 4.40 ms | 2.98 ms | 5.12 ms | 3.43 ms |
| フィード絞り込み | 4.27 ms | 1.80 ms | 5.56 ms | 1.96 ms |

未読ページのSQLは6→4回、JSONは約40.7→30.4 KB。
絞り込みの実行計画は旧feed索引のindex join・sortから、新しい複合索引の逆順scan・limitへ変化した。
これはrepository単体の測定で、本番の認証・ネットワーク・cold start・画像取得を含まない。
本番での画面表示時間・取得完了時間・RUの改善率は未計測である。

## 更新中の操作と一覧の世代

未読一覧は初回取得時の `snapshotRevision` を維持する。更新中も記事を開く、保存、
ページ移動、購読の絞り込みを行える。フィード更新後の再取得では新着を現在の一覧へ
挿入せず、「新着N件を表示」を出す。押すと最新世代の先頭へ移動する。
絞り込みは保持し、新着件数も対象の購読に限定する。ページ移動・絞り込みだけでは
世代を更新しない。通知は一覧再取得時に更新し、別タブやCronの変更は定期読取・画面復帰・手動更新で検出する。常時pushは行わない。

「すべて既読」は表示中のページだけでなく、その世代までの全ページを対象にする。
絞り込み中は対象購読だけを既読にする。ブラウザのクリック時刻は使用しない。
たとえば61件の2ページ目で5件の新着が届いても、表示中の11件は新着でずれず、
一括既読では元の61件だけを削除する。新着5件は残り、通知から表示できる。
世代内の記事が空になった場合も、空表示と新着通知を併記する。

所有者ごとの `rss_states.revision` と、未読行の `revision` を使う。新着登録時の
世代加算と記事・hashの登録は同一トランザクションで確定する。新着のない304・
メタデータ補正では世代を進めない。既存記事は世代0として移行する。
一覧の世代・記事・件数・星状態は同一のserializableトランザクションで読み、競合は
既存helperで再試行する。時刻差や未完了の取得処理を一括既読の境界に含めない。

一覧APIは任意の `snapshotRevision` を受け取り、応答に採用した `snapshotRevision`、
その世代より後の未読件数 `newerCount`、補正済み `offset` を返す。未指定時は最新世代、
未来の世代指定は現在世代までに制限する。`unreadCount` は世代内の件数で、新着件数とは
別に扱う。MCPの `list_rss` も次ページでは応答の世代を渡せる。
一括既読APIは `before` に代えて `snapshotRevision` を受け取り、個別既読は `ids` を使う。
保存済み一覧は最新の保存状態を取得し、未読の世代による制限は適用しない。

既読化・購読解除・保存解除による削除は反映する。削除で指定ページがなくなれば、
有効な最終ページへ補正し、全件削除なら先頭の空表示へ戻す。削除前の表示を維持する
目的で記事を復活させない。

mutationは画面ごとのキューで直列処理する。同じ記事の既読操作やフォームの連打を
重複登録せず、別の記事を続けて開いた場合は各IDを保持する。全処理が終わるまで
待機状態を保つ。開始前の一覧要求は直ちに無効化し、mutation中は再取得を保留して、
最後に現在のページ・絞り込みを再取得する。失敗したmutationは自動再送せず、
エラーを表示して一覧を再照合する。後続の既読操作は継続する。

ページ・絞り込み変更中に残る旧カードからは既読・保存を実行しない。
要求をabortした後も応答が到着し得るため、要求識別で古い成功・失敗を除外する。
移動先の取得失敗では旧表示を保持し、再試行またはページを戻す操作で復帰できる。
画面を離れると未開始のmutationを破棄し、旧callbackやtimerから画面を更新しない。

## iOSリーダー

iOSの先頭のRSSタブでも未読・保存済みを切り替え、購読別に未読を絞り込める。
記事は既定の外部ブラウザで開く。オンラインで開けた未読記事をIDで既読化し、
一括既読は確認時に取得済みの記事IDを100件ずつ送信するため、後着の記事を含めない。
保存リンクは既読化・購読解除と独立して残る。購読追加・解除・Inoreader取り込みは
設定の「RSSの購読管理」に置く。

RSSの未読・保存済み全件と購読情報を所有者・API接続先別に端末へキャッシュする。
キャッシュのJSON変換とSwiftData保存は専用actorで行い、画面の操作を待たせない。
初回は先頭ページを先行表示し、続くページを段階的に表示する。完全キャッシュは全件取得後に
原子的に置換し、途中失敗時は前回の完全キャッシュを保持する。
未読の全ページで初回応答の `snapshotRevision` を指定し、件数・重複ID・応答のoffset・
先頭ページの再照合で削除などによる変化を検出する。再取得は1回までとする。
世代は新着を区切るもので、全ページにまたがるDB snapshotではない。

モデル所有のmutationキューで書き込みを直列化し、同じ記事の既読・同じ保存指示を重複排除する。
別の記事の操作と一覧のページ移動・絞り込みは維持する。大量の既読・取り込みはAPIバッチ間で
記事操作を優先する。成功した既読・保存・解除はローカルへ反映し、操作ごとの全件取得をしない。
保存APIは `{ added, saved }` を返し、重複保存でも既存のID・保存日時・メタデータを返す。
応答不明の書き込みは自動再送せず、キュー終了時に読み取りで再照合する。
iOSの同期はDBメタデータの1回の全件取得へ集約し、同時の更新要求は同じ処理へ合流する。
pull-to-refreshは選択中の未読・保存済みの先頭ページのDB応答で終了する。残りのページは
モデル所有のタスクで同期し、一覧内に静的な同期状況を表示する。エラー・取消・ログアウトでは
待機を解除する。完全キャッシュは最後まで成功した場合だけ置換する。
一覧の全件絞り込み・初期受付ID・配信元辞書はメインアクター外で作成し、
データ世代・所有者・表示条件が変わった計算結果は反映しない。

所有者・接続先の変更、ログアウト、キャッシュ削除は処理の世代を無効化する。
ブラウザcallback・確認ダイアログにも世代を保持し、同一所有者で再ログインしても旧操作を受理しない。
通信切断で中断した書き込みが復帰後に遅れて確定した場合は、同じ所有者・キャッシュの存続中だけ
再照合を要求する。キャッシュ削除後の旧要求からキャッシュを再生成しない。
端末に永続的なRSS書き込みキューは追加せず、オフライン中はメタデータ閲覧を提供する。
本文・サムネイルの画像データは保存しない。画像は最大4件を並列取得し、5 MiBまでの応答を
表示解像度へ縮小デコードする。画像メモリキャッシュは20 MiBに制限する。

### DB競合の回復と監視

Sentryの `S-PRIVATE-SENTRY-7Z`・`80`・`81` では、RSS一覧取得と新着登録の
serialization競合が記録されていた。これらはPrismaの生エラーイベントを直接送信したもので、
最終的なAPI失敗を意味するとは限らない。
DBトランザクション全体の既存リトライは上限を維持し、指数バックオフにjitterを加える。
RSSでは `rss.transaction.retries` と `rss.transaction.retry.duration` を記録し、
`status=recovered/failed` で回復と上限到達を区別する。記事・ユーザー情報は含めない。
Prismaの途中エラーを個別にSentryへ送る経路は廃止し、最終失敗は既存の
`backend_http`・`rss_refresh` などの操作境界で報告する。
本番反映後は同じRSS操作を再実行し、再試行メトリクスと最終失敗の再発を確認する。

詳細・性能比較・残る実機検証は [iOS README](../apps/ios/README.md#rss-reader) を参照する。

# RSSリーダー

既存Webの `/[locale]/rss` で、RSS 2.0／Atomの購読、未読、あとで読むを管理する。
Webは生成clientを呼ぶServer Actionsだけを持ち、認証・所有者確認・取得・永続化は
共通backendの `/api/v1/rss` が担当する。既存Articlesの公開ライフサイクル、
RAG、iOSのdelta sync、MobileSyncChangeには参加しない。

## 保存とライフサイクル

- `rss_feeds` は所有者別の購読、OPMLフォルダー、取得日時、HTTP validator、
  エラー状態、期限付きleaseを保存する。
- `rss_unread` は未読のURL・タイトル・公開日時・取得日時だけを保存する。
  開く操作（通常クリック・中クリック）、個別既読、一括既読で物理削除する。
- `rss_seen` は購読IDと取得済みGUID／Atom IDのSHA-256だけを残す。
  IDがない場合は記事URLを用い、同じフィード内の既読復活を防ぐ。
- `rss_saved` は未読と独立したURL・タイトル・公開日時・保存日時を保存する。
  URLは所有者ごとに一意で、既読化・購読解除でも残り、保存解除で物理削除する。

本文・画像・deleted flag・既読一覧・インポート原本は保存しない。
未読と保存記事の自動期限切れは設けない。購読解除ではその購読の未読とhashを
cascade削除する。再購読は初回取得として、現在のフィード内容を未読にする。
配信元がIDを変更した記事は再登場し得る。

## 取得

RSS画面を開くと、最終試行から1時間以上経過した購読を5件ずつ取得する。
手動更新も用意するが、連続取得は1分間隔までに制限する。
外部スケジューラー・常駐workerは使用しない。
アプリ未使用中にフィードから消えた記事は取得できない。

ETag／Last-Modifiedによる条件付き取得を行い、304では未読・hashを変更しない。
レスポンスは2 MiB、取得は15秒、redirectは5回までに制限する。
HTTP(S)の公開IP・標準Webポートだけを許可し、DNS解決結果を実接続へ固定する。
redirect先も同様に検証する。XMLのDOCTYPE・ENTITYを拒否する。

購読単位の60秒leaseとtokenで並行取得と古い処理のcommitを防ぎ、
hash登録・未読作成・HTTP validator更新を同じトランザクションで確定する。
CockroachDBのserialization競合は既存のretry helperで再実行する。
失敗時は未読・hash・validatorを保持し、最終試行時刻と簡潔な失敗状態だけを更新する。

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

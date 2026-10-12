# 共通backendへの移行

## 到達する構成

Next.jsはSSR、UI、薄いBFFを担当し、iOSと共通のHono backendへアクセスする。
backendは認証・tenant・ユースケース・永続化・検索・同期・画像処理・通知・Cronを所有する。
ドメイン層は既存の `packages/core` を維持し、Webからの依存を段階的に解消する。
初期の独立実行環境はVercel Node.js。Cloudflare Workers対応は別途検討する。
デプロイとProduction切替は手動で行う。

## 契約と生成

`packages/api-contracts/src` のZodスキーマとHonoルート定義を正本とする。
`docs/openapi/backend-v1.json` はレビュー用の生成スナップショットであり手編集しない。
Swiftもこの1ファイルを入力にし、コピーは保持しない。
DB接続、環境変数、Next.js、coreを読み込まずに生成できる。
`/api/v1` の読み取り処理は共有backendのHono routerへ接続し、Next.jsではfetchだけを委譲する。
CookieまたはAuth0 Bearerから所有者を確定し、tenant contextを確立してからDBへアクセスする。
Authorizationがある場合はCookieへfallbackしない。Cookie mutationには信頼するWeb originを必須とする。
DBの日時をISO文字列にし、公開Zod DTOで内部のuserId等を除去してから応答する。
検索indexのpayloadは公開せず、所有者のDBレコードで照合した本文・metadataだけを返す。
読み取り応答とエラーはprivate/no-storeとし、Web sessionの更新Cookieは入口から転送する。
作成・削除と分割uploadも同じrouterへ接続する。JSONは4MiB、chunkは1MiBまでとし、
Vercelのrequest上限を超える画像は直接Server Actionへ送らない。
Webの画像・書影はブラウザの生成clientから1MiBずつ直列送信し、受信済みpartをスキップする。
書影はフォームdraftのoperation ID、画像は保持したFileごとのIDを再送に使う。
成功後の応答が失われてsessionが削除済みでも、同じoperation IDで再開して作成結果を照合する。
WebのdraftとFileは画面内で保持し、ページ再読み込み後の永続キューは追加しない。
operation IDと入力hashの一致を確認し、成功済みの作成は保存済みresource IDを返す。
新しい画像の保存pathはoperation IDと検出した画像形式から確定し、失敗後の再送でも変えない。
書籍metadataはJSONで保存し、tags内のカンマも保持する。旧uploadの文字列metadataも読み取れる。
uploadの完了は全partと合計byte数を確認し、作成成功後だけchunkを削除する。
旧画像operationのFAILED状態はpathとの対応を確定できないため409とし、最新画像を推測して返さない。
切替前にFAILED/PENDING操作を調査し、DB保存後に失敗した自然キー付き操作は手動で照合する。
既存レコードと同じURL・title・ISBNであるだけでは、別operationの成功として扱わない。
既存の `/api/mobile/v1` はNext.jsのcatch-all Route HandlerからHonoへ委譲する。
`app/src/backend/http/mobile` にHTTP処理を集約し、Next.jsのparams型を持たないcontrollerへ分離する。
Bearer認証・tenant・操作ID・upload・同期の既存ユースケースとwire形式を共有する。
一時的な配置であり、後続PRで独立backendのpackageへ移す。
手書きiOSクライアントとWebの通信経路は引き続き有効。

`packages/backend` はNext.jsに依存しない実装packageとし、ドメイン別の公開subpathを持つ。
articles／notes／images／booksの入力検証、作成・削除ユースケース、Prismaリポジトリを配置する。
所有者IDとイベントdispatchは明示的な依存として渡し、backend内でWeb sessionを取得しない。
Next.js側はFormData、認証、エラー変換、既存キャッシュの無効化を担う暫定adapterとなる。
Prismaのquery hook構成と拡張済みclient型もbackendで共有し、tenant contextと監視の値は入口から注入する。
既存のtenant policy、SQL、イベント、書き込み回数は維持する。
HTTP入口とクライアントを切り替える前に処理を移管するため、この段階では新しい通信は発生しない。

画像・書籍の入力はFileと型付きmetadataで受け取り、FormDataの読み取りはWeb adapterに残す。
署名・decode形式の検査、Sharpの192px WebP thumbnail生成、MinIOの保存prefixはbackendで共有する。
original→thumbnail→DB→イベントの順序と既存の失敗時動作を維持する。
operation／storage phaseと不正画像の診断エラーもbackendで定義し、Webのエラー変換から再利用する。

同期cursor・snapshot・差分取得とoperationの冪等性管理は `packages/backend/src/mobile` に置く。
DBの状態と保存形式を維持し、Webでは既存の依存を注入するadapterだけを残す。
共有Prisma persistenceとMinIO chunk storeも設定を受け取るfactoryとする。
Qdrant検索と結果整形は `packages/backend/src/search` に置き、Webから設定・検索portを渡す。

Better Authのprovider・session設定、Auth0 Bearer検証、tenant context／filterもbackendで共有する。
Bearer検証はjoseのRS256・issuer・audience・必須claims検証とRemote JWKS resolverを使用する。
[JWKS resolver](https://github.com/panva/jose/blob/main/docs/jwks/remote/functions/createRemoteJWKSet.md)は公開鍵だけを短時間保持する。
ログ・イベント・Pushover／Web Push・Cron処理は監視port、設定、リポジトリを受け取る。
Next.js用Sentry adapterはWeb側に置き、独立backendでも同じ処理を利用できる構成にする。

```bash
pnpm api:generate
pnpm api:check
mise run ios:generate
swift test --package-path ios/Packages/SPrivateAPI
```

`api:check` は一時ディレクトリにOpenAPIを再生成し、Git管理したスナップショットと比較する。
作業中の生成物を書き換えず、TypeScript生成コードの有無には依存しない。
Orvalの型・fetch・Zodモデル・束縛clientはすべて `packages/api-client/src/generated` に生成し、Git管理しない。
api-clientのbuildは必ず契約から再生成し、契約packageへの明示的な依存によりworkspaceのbuild順序を保証する。
個別のapi-client型検査も生成・buildを先に実行する。CIはスナップショットの一致と生成clientの型検査を確認する。
Swiftは同じOpenAPIスナップショットから固定バージョンのCLIを `ios:generate` の前処理で実行する。
生成Swiftソースと `.build` もGit管理しない。
GitHubでは生成スナップショットを既定で折りたたみ、契約・生成設定・通信処理をレビュー対象にする。

Web向けクライアントはOrvalのfetch実装とZodモデルを利用する。
`createBackendClient` がリクエスト単位のbase URL、Cookie／Bearer、fetch adapterを束縛する。
生成したstatus別のレスポンス定義でJSON、エラーコード、未知のstatusを検証し、
失敗時は `ApiHttpError` または `ApiProtocolError` を返す。mutationは自動再試行しない。
空の204応答は公開クライアントで `data: undefined` に正規化する。

コンテンツAPIはドメイン別に型を確定し、同期はactionとdomainのdiscriminatorを使用する。
日時はISO 8601、ID・cursor・同期versionは文字列とする。
画像・書籍のupload metadataもドメイン別の型にし、書籍のratingは数値、tagsは配列とする。
入力の検証とJSON出力の検証はbackendでも実施する。
Web Pushの登録・解除・テスト送信も共通APIに接続する。
endpointの事前所有者チェックに加え、upsertの条件にもuserIdを含めて競合時の他ユーザー更新を防ぐ。
所有権違反は403、未登録へのテスト送信は404、VAPID設定不足は503として公開する。
WebのPush Server Actionも生成clientへ委譲し、DB・VAPID設定・配信処理はbackendだけで扱う。
Swift runtimeの日時変換はミリ秒あり・なしのISO 8601を受け付け、APIの日時精度を保持する。
Swift生成clientは呼び出しごとのBearer tokenを使い、Web Cookie・URLキャッシュを共有しない。
ネイティブのHTTP redirectを追従せず、失敗応答も生成したエラー契約で読む。
メディア契約は実際のJPEG・PNG・WebPとoctet-streamを列挙し、Swiftも対応するbinary bodyを受信する。HTMLの成功応答は拒否する。
エラー本文は16KiBに制限し、HTTP statusと公開codeだけを取り出す。通信・mutationの自動再試行は追加しない。
Better AuthのOAuthプロトコルと内部Cronは、一般クライアント契約から分離する。

## 段階移行

| 順序 | PRの内容 |
| --- | --- |
| 1 | 契約、Orval／Swift生成、型検査、CI |
| 2 | mobile APIをHonoへ置換しNext.js内でホスト |
| 3 | articles／notesのユースケース・永続化を抽出 |
| 4 | images／books・Sharp・MinIOを抽出 |
| 5 | 検索・同期・operation管理を抽出 |
| 6 | 認証・tenant・通知・Cron・観測処理を抽出 |
| 7a | 共通APIの認証・tenant境界と読み取りHTTP処理を接続 |
| 7b | mutation・分割uploadを共通APIへ接続 |
| 7c | Web Push APIの接続 |
| 7d | Webの記事・ノート読み取りを生成クライアントへ切替 |
| 7e | Webの画像・書籍読み取りを切替 |
| 7f | Web検索を生成クライアントへ切替 |
| 7g | Webの記事・ノート作成と全ドメイン削除を生成クライアントへ切替 |
| 7h | Web Pushを生成クライアントへ切替 |
| 7i | ブラウザからの1MiB分割uploadへ切替 |
| 7j | Webセッション検証を共通APIへ切替 |
| 7k | 残る依存と永続キャッシュを撤去 |
| 8a | Swift生成clientのBearer認証・HTTP失敗境界を準備 |
| 8b | 旧書籍uploadのCSVタグ・操作hashの再開境界を補強 |
| 8c | SwiftのMIME・日時・固定整数の契約を検証 |
| 8d | iOSを生成クライアント・共通APIへ切替 |
| 9a | APIの依存組み立てを共有し、Next.jsのキャッシュadapterを外す |
| 9b | サインイン・OAuth・API認証 adapter の共有化 |
| 9c | ローカル fixture の共有化 |
| 9d | HonoのHTTP host・公開Origin境界 |
| 9e | 独立Hono backendの起動・Vercel配置準備 |
| 10a | 同一origin BFF・設定による独立backend接続 |
| 10b | 暫定実装の撤去と手動切替gate |

各PRは直前のPRをbaseにし、順番にマージ・デプロイできる状態を維持する。
同一機能の二重書き込みは行わず、旧APIと新APIは同じユースケースへ委譲する。
DB・認証・同期cursor・operation・未完了uploadの状態を保持する。
iOSは `/api/v1` のSwift生成clientへ切り替える。Auth0 audienceはAPIのURLと独立しているため変更しない。
端末のSwiftData、共有キュー、draftのCodable形式、operation ID・同期cursorは保持し、生成DTOから明示的に変換する。
旧iOS書籍draftのCSVタグは、生成clientへ渡す段階では空白・空要素を保持して配列に分ける。
再送判定は元のCSVを復元して照合し、domain入力を作る段階でtrim・空要素除去を行う。
未完了の旧uploadとの照合では同じ正規化を使い、受信済みchunkを維持する。
長期の旧iOS互換は維持しないが、移行中の既存URLはクライアント切替まで残す。

Webの記事・ノート一覧、件数、カテゴリ、ノート詳細はOrvalクライアント経由で取得する。
`app/src/common/backend/server-client` はCookieとOriginをリクエストごとに束縛し、
独立backendの配置までは同一プロセスのHono fetch adapterを使う。受信したAuthorizationは転送しない。
画像・書籍も同じ生成clientで取得し、書影の配列metadataはキャストせず表示する。
メディアは `/api/v1/media/{domain}/{id}/{variant}` を使用し、backendで所有者を検証してprivate/no-storeで返す。
認証付き書影はNext.js image optimizerを経由せずブラウザから取得し、Cookieを維持する。
画像の代替テキストはURLと分離する。旧path指定の画像Route HandlerとWebのストレージ直接参照は撤去する。
ISBNのハイフン除去と検証はbackendに置く。
Web検索もOrvalクライアントを使い、検索queryと結果の型を共通契約から取得する。
所有者のDBと照合済みの結果だけを表示し、ノートのtitleと書籍のISBNを詳細リンクへ変換する。
Webの検索経路はQdrant・ドメイン型・独自の検索スキーマに依存しない。
本文の表示用変換はWeb側で行い、ノート詳細はviewerが必要とするtitle・markdownだけを公開する。
401はWebの認証境界へ、ノートの404だけはnullへ変換する。
Webの記事・ノート作成と全ドメイン削除も生成clientへ委譲し、所有者・削除可能な状態をbackendで検証する。
フォームはoperation IDをdraftと共に保持し、失敗後の同一入力は同じIDを使う。
入力を変更した場合は新しいIDを生成し、ファイルは内容のSHA-256も比較する。
Webのユーザーデータ取得はno-storeとリクエスト内の重複排除へ移行する。
iOS変更は次回取得で反映し、サービス間の永続キャッシュ無効化通知を廃止する。
Webのページ・Server Actionのセッション検証も生成clientの `/session` を使い、Webは認証DB・ドメインID・認証監視イベントへ直接依存しない。
401はWebの認証境界へ変換し、ローカルの期限切れCookieだけは再サインインへ戻す。Vercelではこの迂回を許可しない。
Auth0＋Better Authを維持し、Webの同一originの認証URLはBFFで中継する。
独立稼働への切替前にOAuth callback、画像の最大サイズ転送、外部サービス接続を検証する。
Cronは旧・新で同時に有効化しない。

共通APIの依存組み立ては `packages/backend/src/api/composition` に置く。
DB・chunk store・storage・event dispatcher・search・通知設定を型付きで受け取り、
raw repositoryとdomain service、読み取り・mutation・upload・Pushの各serviceを組み立てる。
Next.jsのcommand cache adapterを使わず、同じ構成を独立backendで再利用する。

サインインは標準Request／Responseの共有handlerを使用し、OAuthのstate Cookieを複数とも転送する。
ローカルユーザーの検索・fixture seedは注入し、Vercel上のローカル認証禁止を維持する。
APIのCookieセッション・Bearer検証・信頼Origin判定も共有factoryで組み立てる。

ローカル開発のfixture作成はbackendのfactoryへ移し、DB・storage・画像ファイル読み込みを注入する。
fixture画像の正本もbackendに置き、独立サービスのローカル認証で同じ初期データを利用する。
本番の認証入口はfixtureを実行しない。

HonoのHTTP hostはAPI・認証・サインイン・Cronを型付きhandlerとして受け取る。
OAuthの公開originを検証してrequest URLを復元し、複数Cookieと本文を保持する。
転送元のhost関連headerは除去し、すべての応答をprivate/no-storeにする。

独立Nodeサービスは `services/backend` に置き、共有factoryだけでAPI・認証・イベント・通知を組み立てる。
[手動配置・切替手順](backend-deployment.md)に環境変数とCronの単独稼働手順を記載する。
この段階ではWebの接続先を変更しない。

Webの `BACKEND_URL` 設定後は、API・認証protocol・サインインを固定upstreamへ中継する。
Cookie・Bearer・Origin・Content-Typeを明示的に転送し、SSRから受信Authorizationは転送しない。
redirectは追従せず、複数Set-Cookieとmedia streamを保持する。
未設定の暫定handlerはlazy importし、独立backendの障害時にはfallback・retryしない。

数値queryの型overrideでは上限・下限・既定値も同じ定数からOpenAPIへ明示する。
一覧offsetは既存Web入力の上限10000をAPIにも適用し、生成clientにも制約を保持する。

Webのload-moreは生成したドメイン別queryモデルでoffsetを検証し、ドメイン型を参照しない。
load-moreと検索Server Actionのエラーは共通のAPIエラー変換で処理する。

WebのSSR表示エラーはWeb用Sentryへ記録する。
表示のfallbackとNext.jsのredirect／not-found再throwを維持し、ドメインイベントやPushoverをWebから呼び出さない。

# コンテンツ・RSS MCPの設定

## 構成と公開範囲

既存backendの `/mcp` はOAuthのリソースサーバーとして動作する。
Auth0がログイン、同意、クライアント登録、トークン発行を担う。
公式MCP SDKのステートレスHTTP handlerを使い、既存ReadService・WriteService・UploadService・RSSサービスを直接呼び出す。
別REST APIへのトークン転送・交換、MCP用認証DBは使用しない。
すべての呼び出しで認証済みownerとtenant contextを適用する。

公開toolは参照10個・追加8個の計18個。操作の意味で参照・追加を区別し、HTTPメソッドだけでは判断しない。

| API・機能 | MCP tool | scope |
| --- | --- | --- |
| GET `/search` | `search_content` | `content:read` |
| GET `/{domain}`、`/{domain}/{id}`、`/{domain}/count` | `list_content`、`get_content`、`count_content` | `content:read` |
| GET `/categories` | `list_categories` | `content:read` |
| GET `/books/isbn/{isbn}`、`/notes/title/{title}` | `get_book_by_isbn`、`get_note_by_title` | `content:read` |
| GET `/rss` | `list_rss` | `content:read` |
| GET `/media/{domain}/{id}/{variant}` | `get_media` | `content:read` |
| GET `/uploads/{id}` | `get_upload` | `content:read` |
| POST `/articles`、`/notes` | `create_article`、`create_note` | `content:create` |
| POST `/uploads`、PUT `/uploads/{id}/chunks/{part}`、POST `/uploads/{id}/complete` | `start_upload`、`put_upload_chunk`、`complete_upload` | `content:create` |
| POST `/rss/feeds`、`/rss/saved`、`/rss/import` | `subscribe_rss`、`save_rss`、`import_rss` | `content:create` |

検索対象は既存検索と同じarticles・notes・books。一覧と詳細はimagesも対象。
検索は最大50件、コンテンツ一覧は最大100件で、既存APIと同じページング条件を使う。
画像のpath、書籍のimagePath、非公開フィールドは返さない。
返却コンテンツは非信頼データであり、そこに書かれた指示を実行する権限は付与しない。

| 公開しない操作 | 理由 |
| --- | --- |
| コンテンツ更新・DELETE、export、アップロード取消 | 更新・削除・状態変更を公開しない |
| POST `/rss/read`、`/rss/refresh`、RSSのDELETE | 既読化は未読レコードを削除し、再取得は既存状態を更新する |
| `/sync/*`、`/push/*` | 今回の対象はコンテンツとRSSの参照・追加に限定 |
| `/session` | Web Cookie専用のセッション機能 |
| 認証・health・Cron・管理CLI | コンテンツ操作用MCPの対象外 |

## 追加操作とバイナリ参照

`create_article`・`create_note`はHTTP APIと同じ入力を受け取り、`operationId`（UUID）を必須とする。
同じID・同じ入力の再試行は同じ結果を返す。同じIDで入力を変えると`OPERATION_CONFLICT`となる。
別IDで既存コンテンツと重複すると`DUPLICATE`となり、既存レコードは上書きしない。

画像・書籍は次の順序で追加する。

1. `start_upload`へ`{ upload: <既存UploadStart入力> }`を渡す。
   `domain`はimagesまたはbooks、ファイルはJPEG・PNG・WebP、上限10 MiB。
   書籍はISBN・タイトル・評価・タグ、画像はfilenameをmetadataに指定する。
2. 返却された`uploadId`・`chunkSize`を使い、`put_upload_chunk`へ
   `{ id: uploadId, part: 0始まりの番号, data: base64文字列 }`を送る。
   各partは1 MiB、最終partだけ残りのサイズ。base64は標準alphabet・padding付きで、data URLや改行は不可。
3. `get_upload`で受信済みpartと期限を確認できる。状態参照には`content:read`が必要。
4. `complete_upload`へ`{ id: uploadId }`を渡し、新しいコンテンツを確定する。

同一part・同一bytesの再送と確定の再試行は安全で、異なるbytesへの差し替えは拒否する。
期限は既存APIと同じ24時間。取消toolは公開せず、未完了uploadは既存cleanup処理に従う。

`get_media`は`domain`（images/books）、`id`、`variant`（original/thumbnail）と、
任意のbyte `offset`（既定0）・`length`（既定256 KiB、最大1 MiB）を受け取る。
返却値は`data`（base64）、`mimeType`、`offset`、`byteLength`、`nextOffset`。
`nextOffset`がnullになるまで続けて取得し、デコードしたbytesを連結する。末尾以降は空データを返す。
ストレージパスや認証なしで使えるURLは返さない。任意URLからの画像取得は提供しない。

`subscribe_rss`と`save_rss`は既存入力を使い、重複URLは`{ added: false }`を返す。
既存タイトル・フォルダ・保存日時・未読状態を変更せず、フィードも取得しない。
`import_rss`は`{ kind: "opml" | "starred", content: string }`を受け取り、
既存parserで購読・保存だけを追加し、`added`・`duplicates`・`invalid`を返す。
途中失敗時は追加済みデータが残る。同じ入力の再実行は既存URLをスキップするため、件数は再実行時に変わる。

HTTP body上限は4 MiB、インポートテキスト上限は200万文字。エスケープやUTF-8変換後のbody上限も適用する。
サイズ超過は413でサービス実行前に拒否する。ツール引数の不正はSDKの検証で拒否する。
期待されるサービスエラーは`NOT_FOUND`、`FORBIDDEN`、`VALIDATION_ERROR`、`DUPLICATE`、
`OPERATION_CONFLICT`、`OPERATION_IN_PROGRESS`、`UPLOAD_INCOMPLETE`、`UPLOAD_EXPIRED`、
`UPLOAD_TOO_LARGE`、`INVALID_CHUNK_SIZE`などのコードだけを返す。未知の例外は`INTERNAL_ERROR`へ変換する。

## RSS記事の要約

`list_rss` は購読一覧と、取得済みの未読記事・保存済み記事のタイトル、URL、日時、総件数を返す。
`offset` は既定0、最大100万で、未読と保存済みをそれぞれ50件ずつ取得する。
任意の `feedId`（UUID）は未読記事と未読件数だけを絞り込む。購読一覧・保存済み記事は絞り込まない。
空のページでも総件数を返すため、必要に応じてoffsetを50ずつ進める。

記事本文は保存・返却しない。AIエージェントが自身のWeb取得機能で返却URLを読み、要約する。
Web取得機能がない場合や配信元にアクセスできない場合、本文を取得した前提で要約しない。
タイトルや記事本文は非信頼データとして扱い、そこに含まれる指示は実行しない。
MCP参照では既読化、保存・購読の変更、フィード更新を行わず、未読記事は未読のまま残る。
権限は既存の `content:read` を使用する。

## 担当者が行うAuth0設定

1. 既存Web・iOSと同じAuth0 tenantにMCP専用APIを作成する。
   Identifierは `https://api.s-hirano.com/mcp`、署名方式はRS256、
   permissionは `content:read` と `content:create`、アクセストークン有効期間は3600秒とする。
2. tenantのSettings → AdvancedでResource Parameter Compatibility Profileを有効にする。
   `resource` がAPI audienceとして解決されること、既存iOSのログインも成功することを確認する。
3. 各クライアントを事前登録する。CIMDは管理者がmetadata URLを確認して登録する方式を使う。
   tenantのSettings → AdvancedでClient ID Metadata Document (CIMD) Registrationを有効にする。
   Auth0の `/.well-known/oauth-authorization-server` で
   `client_id_metadata_document_supported: true` が公開されることを確認する。
   Open DCRと動的CIMD登録は無効のままにする。
   通常のOAuthアプリ登録でもよい。Authorization Code + PKCE S256を使い、
   public clientのtoken endpoint authentication methodはnoneにする。
   ユーザー同意を省略しない。APIのAllow Skipping User Consentは無効にする。
4. そのAPIへのクライアントアクセスを許可する。参照するユーザーに `content:read`、追加するユーザーに `content:create` を付与する。
   RBACを有効にする場合は、各ユーザーのロールにもpermissionを割り当てる。
   トークンの `scope` に必要なpermissionが含まれることを確認する。
   `permissions` claimだけに含まれる場合、MCPは許可しない。
5. 接続の維持にrefresh tokenを使うclientでは、API側のAllow Offline Accessと
   clientのRefresh Token grantを有効にする。rotation有効、最大2592000秒（30日）、
   未使用1296000秒（15日）、重複許容0秒とし、`content:read offline_access` を要求して再認可する。
   refresh tokenは各clientが安全に保存・更新し、MCP backendへ保存しない。

2026-11-14に、既存Claude/Codex clientのRefresh Token grant、上記期限・rotationと、
Production MCP APIのoffline accessを有効化し、Dashboardで保存済みの状態を確認した。
APIのRS256・access token有効期間3600秒・ユーザー同意スキップ無効・アプリごとの認可は維持した。
ChatGPTのCIMD登録・Muse専用client・backendの許可リストは、この設定整理では変更しない。
`offline_access` はAuth0のtoken発行用であり、当時のbackendの操作権限は `content:read` のみだった。
Claude/Codexで接続を継続する場合は、scopeを追加して再認可する。
ChatGPT/Museの初回登録・要求scopeは、それぞれの接続手順とclientの対応に従う。

同日にCodex CLIで `content:read offline_access` を指定した再認可が成功し、
既存callbackで繰り返し認可できることを確認した。さらに同じCodex clientで本番MCPへ接続し、
JWTの署名・issuer・audience・client ID・scopeを検証して、tool一覧と
`count_content`（`domain=books`）の取得に成功した。
refresh token交換で新しいrefresh tokenが発行され、更新後のaccess tokenでも同じ呼び出しが成功した。
検証用tokenはメモリ内だけで扱い、取得件数・本文・tokenを記録していない。
Claudeの実接続、access tokenの3600秒経過後のclientによる自動更新、アプリ再起動後の復帰は未検証。
別tenant・異なるaudience・scope不足の拒否は既存の自動テストで確認し、実Auth0 tokenでの負例試験は行っていない。

既存Webにログインして内部アカウントが作成済みのユーザーだけ利用できる。
Auth0 subjectと既存Accountの紐付けがない場合や、一意でない場合は拒否する。
メールによる自動紐付け、M2Mトークン、Web CookieによるMCP認証は提供しない。

Auth0の設定方法は[Resource Parameter Compatibility Profile](https://support.auth0.com/center/s/article/mcp-audience-error-with-auth0)、
[CIMD事前登録の提供状況](https://auth0.com/changelog?version=v202545)を参照する。
有料機能を新規契約せず、利用中tenantの無料枠・利用上限内で設定する。

## backendの環境変数

| 設定 | 本番値・用途 |
| --- | --- |
| `MCP_RESOURCE_URL` | `https://api.s-hirano.com/mcp`。未設定ならMCPと認可メタデータは404 |
| `MCP_ALLOWED_CLIENT_IDS` | 登録したクライアントIDのカンマ区切り一覧。有効化時は必須 |
| `MCP_ALLOWED_ORIGINS` | 必要なブラウザOriginの追加許可リスト。通常は未設定 |
| `AUTH0_ISSUER_BASE_URL` | 既存Auth0 issuerを共用 |

client IDはJWTの `client_id` または `azp` と照合する。
CIMDではmetadata document URLがclient IDとなる場合があるため、
Auth0で登録・発行された識別子と一致する値を設定する。
両claimがある場合は一致を要求する。`MOBILE_API_AUDIENCE` とMCP audienceは共用できない。
MCPサーバーに新しいclient secretは不要。既存Web用のsecretはそのまま維持する。

Vercelのbackend projectで環境別に設定し、再デプロイする。
Productionの値をPreview全体へコピーしない。Previewで接続確認する場合は、
そのPreviewの公開URL `/mcp` に対応する別API identifierとクライアントを用意する。
設定のないPreviewはMCPを無効にする。backendは直接到達可能にし、
Vercelログイン画面へ転送されないことを担当者が確認する。

Originなしのサーバー間通信は許可する。Originがある場合は公開URL自身または
追加リストのscheme・host・portが完全一致するOriginだけを許可する。
ワイルドカードは使用しない。CORSでも同じリストを使う。
ローカル以外はHTTPS必須。ローカルではloopbackのHTTPのみ許可するが、
Auth0 JWT検証は省略しない。Inspectorをブラウザで使う場合は、その正確なOriginを追加する。

## クライアント登録・接続

すべてのクライアントでMCP URLは `https://api.s-hirano.com/mcp`。
参照は `content:read`、追加は `content:create` が必要。通常は両方を要求する。
既存read tokenには追加権限を与えない。createのみのtokenは追加toolを呼べるが、参照toolは呼べない。
tool一覧は共通で、呼び出し時に各scopeを検証する。

追加を有効にする担当者は、Auth0 APIのpermission追加、ユーザー／ロールと対象clientへの許可、
clientの要求scopeへの追加後、本人による同意・再認可を行う。
以下のクライアント設定例は参照のみ。追加する場合は要求scopeに `content:create` を加える。
この実装ではAuth0の設定変更は実施しておらず、新scopeの実Auth0・各clientでの接続は別途確認する。
ログイン・同意は利用者本人が行う。client secretが必要ならクライアントの安全な入力画面に入れ、
チャット・Git・backendの環境変数へ転記しない。

クライアントごとにAuth0アプリを分離する。MCPのtool・resource・scopeとJWT検証は共通にし、
接続元を追加するときはAuth0の登録とbackendの許可リストを更新する。
ChatGPT専用の認証分岐や、他クライアントへのclient ID・secretの流用は行わない。
CIMDを使わないクライアントも、Authorization Code + PKCE S256と事前登録に対応していれば
同じ `/mcp` に接続できる。URLだけで追加できるかは各クライアントの登録方式による。

### ChatGPT

管理者がCIMDを事前登録し、利用者はMCP URLだけで追加する方式を使う。
CIMD対応の宣言を有効にするだけでは接続は完了しない。Auth0への事前登録と
backendのclient許可リストへの追加まで必要となる。

#### 管理者の初回設定

1. Auth0の公開discoveryに `client_id_metadata_document_supported: true` と
   `code_challenge_methods_supported` の `S256` が含まれることを確認する。
   MCPのprotected resource metadataの `authorization_servers` とAuth0の `issuer` は
   末尾の `/` を含め完全一致させる。backend側にAuth0のdiscoveryを自作しない。
2. ChatGPTのMCP接続設定でOAuthとCIMDを選び、接続管理画面に表示される
   metadata document URLとOAuth redirect URIを確認する。
   Auth0へそのCIMD URLを事前登録し、取り込まれたcallbackが表示値と一致することを確認する。
   固定URLを推測したり、callbackにワイルドカードを設定したりしない。
3. アプリにMCP専用APIへのアクセスと `content:read` を許可し、ユーザー同意を必須にする。
   ChatGPTはAuth0がdiscoveryで公開するOIDC scopeも要求するため、アプリの
   OpenID Connect Settingsでユーザー識別を許可し、要求されるOIDC scopeを有効にする。
   token endpoint認証はChatGPTのCIMDとAuth0の両方が対応する `none` または
   `private_key_jwt` と整合させる。`none` でもAuthorization Code + PKCE S256を必須とする。
   `private_key_jwt` ではCIMDに公開されたJWKSを使い、client secretを手入力させない。
   Auth0のインポートで `token_endpoint_auth_methods_supported` が未対応と表示された場合は、
   単数形の `token_endpoint_auth_method` から設定された認証方式と公開鍵の取り込み結果を確認する。
4. Auth0発行JWTの `client_id` または `azp` に入る識別子を確認し、backendの
   Production環境の `MCP_ALLOWED_CLIENT_IDS` に追加して再デプロイする。
   既存clientの値は保持し、Auth0の内部client IDとCIMD URLを推測で置き換えない。
   JWTや認可コードをチャット・Git・ログへ貼らない。

RFC9207対応をAuth0が宣言し、成功・エラーの認可応答に正しい `iss` を返す場合は
安定したCIMD URL・callbackを使える。それ以外では接続ごとのURLとなるため、
新しい接続で異なるURLが表示された場合は管理者が追加登録する。
Auth0のissuer応答設定を変更する場合は、既存Web・iOS・他MCPクライアントのログインも検証する。

#### 利用者の接続

1. ChatGPTでMCP URL `https://api.s-hirano.com/mcp` を入力し、OAuthとCIMDを選ぶ。
   OAuth client ID・client secretの手入力は不要。
2. Auth0で本人がログインし、`content:read` のアクセスに同意する。
3. tool一覧の取得、検索、自分のコンテンツの詳細取得、再接続を確認する。

「OAuthクライアントIDを入力してください」と表示される場合は、CIMDが選択されているか、
Auth0のdiscoveryがCIMD対応を公開しているかを確認する。
ログイン開始後の `invalid_client` はCIMD事前登録とtoken認証方式、callbackエラーは
表示されたredirect URIとの一致、ログイン後の401はJWTのclient許可リストなどを確認する。
DCRや動的CIMD登録の有効化、client許可リストの撤廃で回避しない。

[OpenAI公式認可ガイド](https://developers.openai.com/plugins/build/auth)を参照。

### Claude

Claudeのカスタムコネクタで「Use your own OAuth client」を選び、
callback `https://claude.ai/api/mcp/auth_callback` をAuth0へ登録する。
事前登録client IDと必要なsecretを設定する。画面に別callbackが表示された場合は表示値を優先する。
[Claude公式カスタムコネクタ手順](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)を参照。
Claude Codeで検証する場合はpublic clientを使い、callbackを `http://localhost:8765/callback` に登録する。

```bash
claude mcp add --transport http --client-id YOUR_CLIENT_ID --callback-port 8765 s-private https://api.s-hirano.com/mcp
claude mcp login s-private
```

[Claude Code公式MCPガイド](https://code.claude.com/docs/en/mcp#use-pre-configured-oauth-credentials)を参照。

### Codex

public clientを事前登録し、固定callback portを設定する。
以下は利用者のCodex設定であり、リポジトリに追加しない。

```toml
[mcp_servers.s-private]
url = "https://api.s-hirano.com/mcp"
scopes = ["content:read", "offline_access"]

[mcp_servers.s-private.oauth]
client_id = "YOUR_CLIENT_ID"
callback_port = 8766
```

起動したOAuthフローに表示されるredirect URIのhostとpathを確認し、
同じportの完全一致URLをAuth0へ登録する。登録後 `codex mcp login s-private` を実行する。
callback末尾のIDはMCP URLから導出されるため、ランダムな値とみなして削除しない。
URLを変えずに再ログインし、表示されたredirect URIが登録値と一致することを確認する。
既存設定を変更せずにscopeを指定して再認可する場合は、
`codex mcp login s-private --scopes content:read,offline_access` を使用する。
[Codex設定リファレンス](https://developers.openai.com/codex/config-reference)と
[公式MCPガイド](https://developers.openai.com/codex/mcp)を参照。

### Muse（Meta）

MuseアプリのCustom Connectorを使う。公式ヘルプでは、Museにカスタムコネクタの作成を
依頼し、必要な認証情報をSecure Credentials Storeで設定する方式が案内されている。
MuseがChatGPTと同じCIMDに対応することや、URLだけで追加できることは前提にしない。

今回Muse側から提示された接続設定は以下のとおり。実機接続の成否とは分けて確認する。

| 項目 | 設定 |
| --- | --- |
| MCP URL / Resource / Audience | `https://api.s-hirano.com/mcp` |
| Authorization endpoint | `https://s-hirano.jp.auth0.com/authorize` |
| Token endpoint | `https://s-hirano.jp.auth0.com/oauth/token` |
| Redirect URI | `https://agent.meta.ai/api/hatch/oauth/callback` |
| Scope | `content:read` |
| Token endpoint authentication | `none`（client secretなし） |
| OAuth flow | Authorization Code + PKCE S256 |

この設定ではAuth0のApplication TypeをNative、所有者をサードパーティーとし、
Muse専用のclient IDを事前発行する。Museの追加シートにはこのclient IDを指定する。
DCRによる自動登録は使わず、secretを必要とする認証方式へ切り替えない。
接続先URLとclient IDは公開識別子であり、secretやアクセストークンとは区別する。

1. Museに `https://api.s-hirano.com/mcp` へのカスタムコネクタ作成を依頼する。
   transportはStreamable HTTP、認証はOAuth Authorization Code + PKCE S256、
   scopeは `content:read` と伝える。ログインと同意は本人が行う。
2. Museの接続設定が示すredirect URIとtoken認証方式を確認し、管理者がMuse専用の
   サードパーティーAuth0アプリを事前登録する。callbackは完全一致で登録する。
   CIMD URLが提示される場合は、その内容を確認して事前登録する。
   callbackをChatGPT・Claude・Muse Codeから流用しない。
3. アプリにMCP専用APIの `content:read` だけを許可し、ユーザー同意を必須にする。
   発行JWTのclient識別子を `MCP_ALLOWED_CLIENT_IDS` に追加してbackendを再デプロイする。
4. 事前登録したclient IDをMuseの認証設定へ入力する。上記の公開クライアント構成では
   client secretを入力しない。tool一覧、検索、再接続とユーザー分離を検証する。

Muse側がPKCEまたは事前登録OAuthに対応しない場合は接続を未対応として扱い、
Web Cookieの流用や認証省略では回避しない。実際のcallback・認証方式と接続成功は
利用するMuseアカウントの画面で確認する必要がある。
[Muse公式ヘルプ](https://www.meta.com/help/superintelligence/1687253048996149/)と
[Connectorガイドライン](https://platform.muse.ai/docs)を参照。

Muse CodeはMuseアプリと別のクライアントとして登録する。
公式CLIは `muse mcp login <server> --oauth-client-id <CLIENT_ID> --scope content:read --callback-port <PORT>`
による事前登録clientの指定に対応する。実際のloopback redirect URIをAuth0へ登録する。
[Muse Code公式MCPガイド](https://meta-models.github.io/muse-code-sdk/next/guides/extend/mcp-servers/)を参照。

## 検証・監視・切り戻し

未設定時は `/mcp` と `/.well-known/oauth-protected-resource/mcp` が404を返す。
設定後は認可メタデータが200、未認証 `/mcp` が401とWWW-Authenticateを返すことを確認する。
認可メタデータはAuth0 issuerを示す。認可サーバーのdiscoveryはAuth0から直接取得する。
各リクエストでJWTの署名・issuer・専用audience・期限・subject・client・scopeを検証する。
未認証・無効トークンは401、scope不足は403。内部アカウント未紐付けは401で拒否する。

自動テストではテスト用RSA鍵とJWKSを使い、公式SDKクライアントでHTTP Request/Responseを
通してtoolを検証する。2ユーザーの並行呼び出しでownerとtenantの分離も検証する。
RSSのDB不変性テストは、migration適用済みの専用ローカルDBで実行する。
`RSS_TEST_DATABASE_URL` 未設定時はこのテストをスキップする。
追加の統合テストは専用ローカルCockroachDBとMinIOで4ドメインの追加・再試行・競合・所有者検証、
複数partのアップロード、原本・サムネイル参照、RSSの重複・再インポートと既存データ不変性を検証する。
`MCP_TEST_DATABASE_URL`と`TEST_UPLOAD_INTEGRATION=1`が必要。DB名は`rss_worktree_`で始め、既存migrationを適用する。

```sh
RSS_TEST_DATABASE_URL='postgresql://root@localhost:26257/rss_worktree_mcp?sslmode=disable' \
  pnpm exec vp test run --project backend apps/backend/src/mcp/app.test.ts
MCP_TEST_DATABASE_URL='postgresql://root@localhost:26257/rss_worktree_mcp?sslmode=disable' \
TEST_UPLOAD_INTEGRATION=1 MINIO_ROOT_USER='<local-user>' MINIO_ROOT_PASSWORD='<local-password>' \
  pnpm exec vp test run --project backend apps/backend/src/mcp/flow.integration.test.ts
```

本物のAuth0・3クライアントのログイン・Vercel公開URLは自動テストでは検証できない。
配置後に各クライアントでtool一覧、検索、自分の詳細取得、再接続、
別ユーザーのコンテンツが見えないことを確認する。

Sentryにはtool名、許可済みclient ID、成否、所要時間を記録する。
トークン、検索語、コンテンツ本文、元例外のメッセージはMCPの監視イベントへ送らない。
障害や権限漏れが疑われる場合は `MCP_RESOURCE_URL` を削除して再デプロイし、
MCPを無効化する。必要に応じてAuth0側のclientアクセスやrefresh tokenも失効させる。

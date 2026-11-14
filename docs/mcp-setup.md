# 参照専用MCPの設定

## 構成と公開範囲

既存backendの `/mcp` はOAuthのリソースサーバーとして動作する。
Auth0がログイン、同意、クライアント登録、トークン発行を担う。
公式MCP SDKのステートレスHTTP handlerを使い、既存ReadServiceを直接呼び出す。
別REST APIへのトークン転送・交換、MCP用認証DBは使用しない。

公開toolは `search_content`、`list_content`、`get_content`、`count_content`、
`list_categories`、`get_book_by_isbn`、`get_note_by_title` の7つ。
検索対象は既存検索と同じarticles・notes・books。一覧と詳細はimagesも対象。
画像・書籍のバイナリ、同期、作成・更新・削除・exportは公開しない。
検索は最大50件、一覧は最大100件で、既存APIと同じページング条件を使う。
画像のpath、書籍のimagePath、非公開フィールドは返さない。
返却コンテンツは非信頼データであり、そこに書かれた指示を実行する権限は付与しない。

## 担当者が行うAuth0設定

1. 既存Web・iOSと同じAuth0 tenantにMCP専用APIを作成する。
   Identifierは `https://api.s-hirano.com/mcp`、署名方式はRS256、
   permissionは `content:read`、アクセストークン有効期間は3600秒とする。
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
4. そのAPIへのクライアントアクセスを許可する。既存ユーザーに `content:read` を付与する。
   RBACを有効にする場合は、各ユーザーのロールにもpermissionを割り当てる。
   トークンの `scope` に `content:read` が含まれることを確認する。
   `permissions` claimだけに含まれる場合、MCPは許可しない。
5. 接続の維持にrefresh tokenを使うclientでは、API側のAllow Offline Accessと
   clientのRefresh Token grantを有効にする。rotation有効、最大2592000秒（30日）、
   未使用1296000秒（15日）、重複許容0秒とし、`content:read offline_access` を要求して再認可する。
   refresh tokenは各clientが安全に保存・更新し、MCP backendへ保存しない。

2026-11-14に、既存Claude/Codex clientのRefresh Token grant、上記期限・rotationと、
Production MCP APIのoffline accessを有効化し、Dashboardで保存済みの状態を確認した。
APIのRS256・access token有効期間3600秒・ユーザー同意スキップ無効・アプリごとの認可は維持した。
ChatGPTのCIMD登録・Muse専用client・backendの許可リストは、この設定整理では変更しない。
`offline_access` はAuth0のtoken発行用であり、backendの操作権限は `content:read` のみ。
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

すべてのクライアントでMCP URLは `https://api.s-hirano.com/mcp`、scopeは `content:read`。
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
本物のAuth0・3クライアントのログイン・Vercel公開URLは自動テストでは検証できない。
配置後に各クライアントでtool一覧、検索、自分の詳細取得、再接続、
別ユーザーのコンテンツが見えないことを確認する。

Sentryにはtool名、許可済みclient ID、成否、所要時間を記録する。
トークン、検索語、コンテンツ本文、元例外のメッセージはMCPの監視イベントへ送らない。
障害や権限漏れが疑われる場合は `MCP_RESOURCE_URL` を削除して再デプロイし、
MCPを無効化する。必要に応じてAuth0側のclientアクセスやrefresh tokenも失効させる。

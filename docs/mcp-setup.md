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
   Open DCRと動的CIMD登録は無効のままにする。
   通常のOAuthアプリ登録でもよい。Authorization Code + PKCE S256を使い、
   public clientのtoken endpoint authentication methodはnoneにする。
   ユーザー同意を省略しない。APIのAllow Skipping User Consentは無効にする。
4. そのAPIへのクライアントアクセスを許可する。既存ユーザーに `content:read` を付与する。
   RBACを有効にする場合は、各ユーザーのロールにもpermissionを割り当てる。
   トークンの `scope` に `content:read` が含まれることを確認する。
   `permissions` claimだけに含まれる場合、MCPは許可しない。
5. 接続の維持にrefresh tokenを使う場合はAPI側のAllow Offline Accessを有効にし、
   対象clientでrotationと有効期限を設定する。refresh tokenをMCP backendへ保存しない。

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

### ChatGPT

MCP接続の管理画面に表示されるmetadata document URLまたはOAuth callback URLを
Auth0へ事前登録する。固定URLを推測せず、画面に表示される値を使う。
CIMDを使わない場合は、事前登録したclient IDと必要なsecretを接続画面で指定する。
RFC9207対応の場合は安定したCIMD URL・callbackを使えるが、Auth0のdiscoveryと
認可応答のissuer対応を確認してから選ぶ。登録後、OAuth接続を開始して同意する。
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
scopes = ["content:read"]

[mcp_servers.s-private.oauth]
client_id = "YOUR_CLIENT_ID"
callback_port = 8766
```

起動したOAuthフローに表示されるredirect URIのhostとpathを確認し、
同じportの完全一致URLをAuth0へ登録する。登録後 `codex mcp login s-private` を実行する。
[Codex設定リファレンス](https://developers.openai.com/codex/config-reference)と
[公式MCPガイド](https://developers.openai.com/codex/mcp)を参照。

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

# 開発エージェントのMCP設定

## 管理方法

接続定義の正本は `.harness/mcp.json`。`pnpm harness:sync` でCodexの
`.codex/config.toml` とClaude Codeの `.mcp.json` に反映し、両方をGit管理する。
生成部分は直接編集しない。`pnpm harness:check` は不一致を検出する。
Codexの既存features・pluginsと両クライアントのhooksは維持する。
アプリが公開する参照専用MCPは別物であり、[接続手順](mcp-setup.md)を参照する。
個人用Memdex接続は共通設定に追加しない。

設定は管理・更新toolも利用できる構成であり、実際の権限はログイン先のアカウント、
OAuth同意、API keyで決まる。設定を追加しただけでは認証や権限付与は完了しない。
本番への変更は作業依頼の範囲内で行い、接続確認だけのためにデータを更新しない。

## 接続一覧

| 接続名 | 用途・公式手順 | 認証 |
| --- | --- | --- |
| `github` | [Issue・PR・コード](https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-codex.md) | `GITHUB_MCP_TOKEN` |
| `vercel` | [配置・ログ・project管理](https://vercel.com/docs/agent-resources/vercel-mcp) | OAuth |
| `sentry` | [エラー調査・管理](https://mcp.sentry.dev/) | OAuth |
| `auth0` | [tenant・アプリ・ユーザー管理](https://github.com/auth0/auth0-mcp-server) | パッケージの個人用認証ストア |
| `cockroachdb-cloud` | [DB・schema・SQL](https://www.cockroachlabs.com/docs/cockroachcloud/connect-to-the-cockroachdb-cloud-mcp-server) | OAuth |
| `cloudflare` | [DNS・Pages等](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/) | OAuth |
| `qdrant-cloud` | [cluster・backup等](https://qdrant.tech/documentation/qdrant-mcp/cloud/) | OAuth |
| `backblaze-b2` | [bucket・object等](https://github.com/backblaze-labs/b2-mcp) | `B2_APPLICATION_KEY_ID`・`B2_APPLICATION_KEY` |
| `doppler` | [project・config・secret管理](https://docs.doppler.com/docs/mcp) | 個人用keyring、または `DOPPLER_TOKEN` |
| `huggingface` | [モデル・Hubの調査](https://huggingface.co/docs/hub/agents-mcp) | Hugging Faceの接続設定・OAuthに従う |
| `xcodebuildmcp` | iOS Simulator・ビルド・デバッグ | ローカルXcode |

Qdrant Cloud MCPはインフラ管理用であり、アプリの検索APIやcollection内データを
検索するMCPとは異なる。本番embeddingはQdrant Cloud Inferenceを使う。
Hugging Face Hub MCPを追加してもembedding実行経路は変わらない。TEIはローカル用。

iOS接続は共通定義から両クライアントへ固定バージョンで生成する。
Codexでは同名 `xcodebuildmcp` のproject設定が既存 `build-ios-apps@s-private`
プラグインの接続を置き換えるため、二重起動を避けながらプラグインを維持する。
Claude Codeでも同名の個人設定・プラグイン接続がある場合は有効設定を確認する。
project・DerivedDataには現在のworktree内のものを使う。

## 初回設定・移行

1. Node.js・pnpmをセットアップし、`pnpm harness:sync` と `pnpm harness:check` を実行する。
2. Codexでリポジトリをtrusted projectとして開く。Claude Codeでもprojectの接続を確認する。
3. 必要な資格情報を環境変数としてクライアント起動前に渡す。
   Codex appをGUI起動する場合も、そのプロセスに変数が渡るよう起動環境を設定する。
   アプリ用 `.env.local` はMCPクライアントが自動で読む前提にしない。
4. 各クライアントでOAuthを行う。Codexは `codex mcp login sentry` のように接続名を指定する。
   Claude Codeは `/mcp` から接続ごとに認証する。認証状態はクライアント間で共有しない。
5. Auth0は固定済みバージョンの `npx @auth0/auth0-mcp-server@0.1.0-beta.19 init` で認証する。
   対話設定が個人・project設定に定義を追加した場合は、生成設定と重複しないよう確認する。
   管理toolを使うため、従来の `--read-only` ではなく必要な管理scopeで再認証する。
6. Dopplerは `npx @dopplerhq/mcp-server@1.0.5 login` で個人用keyringへ保存できる。
   tokenを使う場合は対象project・configに必要な管理権限を持つものを渡す。
7. `codex mcp list` とClaude Codeの `/mcp` で接続状態を確認し、一覧取得等の参照操作を行う。

GitHubには対象リポジトリのIssue・PRを作成できるtokenを使う。
Claude Codeでは `${GITHUB_MCP_TOKEN}` を実行時に展開し、Codexでは
`bearer_token_env_var` で同じ変数を参照する。値を生成ファイルへ書き込まない。

B2は必要なbucketに限定した更新可能なapplication keyを使う。
`B2_REGION` は任意。アプリの `S3_*` はMCPのB2 Native API資格情報へ自動転用しない。
master keyは共通設定へ渡さない。CockroachDBのSQL更新は公式の書込同意・DB権限も必要。
既存アプリ用credentialを上位権限に変更せず、必要なMCP権限を別途設定する。

個人設定 `~/.codex/config.toml` のSentry・Auth0は自動削除しない。
project設定で接続確認した後、個人でも必要か判断して重複を整理する。
特に同名Auth0の古い引数や `--read-only` が有効設定に残っていないか確認する。
プラグイン版GitHub・Vercel・Sentryが有効な場合も、同じサービスの接続を重複利用しない。
OAuth token・API key・secretをGit・チャット・PR・診断ログへ記録しない。

## MCP以外の操作

- Storybookは `pnpm exec storybook tools ...` を使う。固定URLのMCPは登録しない。
- Pushoverは2026-11-15時点の調査で公式MCPを確認できていない。
  [公式API](https://pushover.net/api)と既存 `packages/notification` を使う。
  `PUSHOVER_USER_KEY`・`PUSHOVER_APP_TOKEN` は既存環境設定で管理する。
  接続確認目的の通知送信は行わない。
- MinIO・TEI・CockroachDB・Qdrantのローカル環境は既存Docker構成で起動する。
  ConoHaは現行開発用MCPの対象外。

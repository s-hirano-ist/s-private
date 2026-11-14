# Development Setup

## Quick Start

```bash
mise install         # Node.js、pnpm等をインストール
pnpm install
pnpm dev             # Docker依存サービス初期化 + 開発サーバー起動
```

## Static Documentation And UI Gallery

GitHub Pages 用の静的成果物は `.pages/` に生成します。

```bash
pnpm pages:build
```

出力構成:

- `.pages/api/` - TypeDoc + DB schema documentation
- `.pages/ui/` - Storybook iframe を横スクロールで一覧する UI gallery
- `.pages/ui/storybook/` - gallery が埋め込む static Storybook

### Pages Deployment

`docs` workflow は `main` への push と、`main` を指定した手動実行で Pages を公開します。
ビルドからデプロイまでを workflow 単位の concurrency で制御し、同じ ref の新しい実行が来たら
古い実行を `cancel-in-progress: true` でキャンセルします。これにより、古い queued 実行が
後続のデプロイを待たせ続けることや、古い成果物が後から公開されることを防ぎます。
job の `timeout-minutes` はランナー上の実行時間に対する制限であり、待機時間の上限にはなりません。

公開が更新されない場合は、Actions の `docs` workflow で最新の build / deploy と、
過去の queued / pending 実行を確認します。古い実行が残っていればキャンセルし、最新の実行を
再実行します。通常のキャンセルが効かない場合は `gh api --method POST repos/s-hirano-ist/s-private/actions/runs/<run-id>/force-cancel`
で対象の古い実行を停止できます。それでも進まなければ GitHub 側の障害やキューの問題を確認します。
デプロイ成功後は公開 HTML の更新も確認してください。

### Search Engine Indexing

GitHub Pages は URL から閲覧できる状態を保ち、検索結果には掲載しない方針です。
公開 URL は <https://docs.s-hirano.com/> です。
Pages 生成の最終処理で、トップページ、API・DB 資料、UI Gallery、Storybook の
iframe を含む全 HTML の `<head>` に `<meta name="robots" content="noindex, nofollow">` を追加します。
`noindex` を検索エンジンが読み取れるよう、`robots.txt` によるクロール拒否は追加しません。
これはアクセス制限ではなく、クロール自体を完全に停止する設定でもありません。
Next.js アプリ側の検索設定には影響しません。

デプロイ後は Google Search Console で次を確認します。

1. 「URL 検査」→「公開 URL をテスト」で代表ページを検査し、`noindex` によりインデックス登録不可であることを確認します。
2. 早く検索結果から消したい場合は、「削除」→「新しいリクエスト」→「URL を一時的に削除」で `https://docs.s-hirano.com/` を入力し、「このプレフィックスで始まる URL をすべて削除」を選びます。公開 URL が変わった場合は、他サイトを含めないよう、このプロジェクトの公開ベース URL を指定します。一時削除は約 6 か月のため、恒久対策として `noindex` を維持します。
3. この Pages 専用のサイトマップを登録していれば、Search Console からその登録を削除します。
4. 「noindex タグによって除外されました」は期待どおりの状態です。検索掲載を目的としないページの未登録理由をすべて解消する必要はありません。
5. プロパティ削除自体には検索除外の効果がありません。除外確認後、監視が不要になった場合だけ一覧から外します。

詳細は Google の [noindex の説明](https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=ja)と
[一時削除の手順](https://support.google.com/webmasters/answer/9689846?hl=ja)を参照してください。

## Mise Configuration

This project uses [Mise](https://mise.jdx.dev/) for tool version management.

- **Node.js** は v24.11 以上が必須です。`.nvmrc` は開発・CIで使う推奨パッチ版を固定し、Mise は `.mise.toml` の `idiomatic_version_file_enable_tools = ["node"]` 設定によりこれを読み込みます。`package.json#engines.node` は最低バージョンを表し、CI で `.nvmrc` がその範囲を満たすことを検証します。Vercel ダッシュボードの Node.js Version 設定も `.nvmrc` と同じメジャーに揃えてください。
- **pnpm** など他ツールのバージョンは `.mise.toml` の `[tools]` で定義されています。

1. [Mise](https://mise.jdx.dev/getting-started.html) をインストール
2. プロジェクトルートで以下を実行:

   ```bash
   mise install
   ```

**Note**: Mise はプロジェクトディレクトリに入ると `.mise.toml` で指定されたツールバージョンを自動的に使用します。また、`.env.local` の環境変数も自動的に読み込みます（`_.file = ".env.local"`）。

## iOS 27 Development

iOSアプリの開発には、Apple silicon Mac、Xcode 27、iOS 27 Simulator runtimeが必要です。Command Line ToolsだけではiOSアプリをビルドできません。Xcode 27をMac App Storeからインストールした後、次を実行します。

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
xcodebuild -downloadPlatform iOS -buildVersion 27.0
mise install
```

Xcodeプロジェクトは`apps/ios/project.yml`から生成し、生成物自体はGit管理しません。

```bash
mise run ios:generate # Xcodeプロジェクトを生成
mise run ios:build    # Simulator向けビルド
mise run ios:test     # 単体テストとUIテスト
mise run ios:run      # iPhone 17 Simulatorへインストールして起動
```

詳細とトラブルシュートは[`apps/ios/README.md`](../apps/ios/README.md)を参照してください。

## Environment Variables

ローカル環境はコミット済みの `.env.local`、Preview/ProductionはVercel Dashboardで管理します。ローカルファイルには外部環境で通用する秘密値を置きません。

### セットアップ

Miseはプロジェクトルートの`.env.local`を読み込みます。`pnpm dev`はMiseの有無にかかわらず同ファイルを明示的に読み込み、Docker Compose起動、migration、検索初期化を実行した後、Next.jsと独立Hono backend、UI build watcherをまとめて起動します。
`pnpm dev:app` は依存サービスの準備を省略して同じアプリ構成を起動します。
Webの接続先は既定で `http://127.0.0.1:3002`。`BACKEND_PORT` でbackendのlisten portを変更でき、明示した `BACKEND_URL` は優先します。

ローカルでは固定開発ユーザーを初回アクセス時に作成して自動ログインします。同時に、articles・notes・images・booksそれぞれへDumper用の未エクスポートデータとViewer用のエクスポート済みサンプルデータを投入します。以後のログインでは不足したサンプルを補い、画像サンプルを最新の枠付き画像へ更新します。以前の1×1ピクセルの画像サンプルも、次のログイン時に置き換わります。サンプルを含むローカルデータを作り直すには、`docker compose --env-file .env.local --profile local down -v`でCockroachDBとMinIOのvolumeを削除してから`pnpm dev`を実行してください。Vercelでは`LOCAL_DEV_MODE`を無視し、Auth0のみを使用します。

### 変数一覧

環境変数のスキーマと型定義は `apps/web/src/env.ts`（`@t3-oss/env-nextjs` + Zod）を参照してください。
Docker Compose 用の変数（VPS デプロイ時）は [docs/vps-deployment.md Step 7](vps-deployment.md) を参照してください。

### Auth0 callback URL

Auth0 Dashboard の Application Settings で、各環境の公開URLに対応する次のURLを **Allowed Callback URLs** に登録します。

```text
https://<application-origin>/api/auth/callback/auth0
```

Better Auth 1.7ではGeneric OAuthも標準のsocial provider callbackを使用します。旧URLの
`/api/auth/oauth2/callback/auth0`は使用しません。

### Auth0の環境分離と最小設定

Auth0 tenantはProductionの `s-hirano` と、Webのlocal/Preview用の
`s-hirano-dev` に分離します。環境タグはそれぞれProductionとDevelopmentです。
devにiOS・MCP用APIを追加せず、Productionのユーザー・client secretをPreviewへコピーしません。
ローカルの通常開発は引き続き `LOCAL_DEV_MODE=true` を使います。

WebのApplicationは両環境ともRegular Web Application、OIDC準拠、RS256、
token endpoint認証は `client_secret_post`、grantはAuthorization Codeのみとします。
セッションはBetter Authが管理し、Auth0の `offline_access` は要求しません。
ブラウザからAuth0への直接通信を使わないため、Allowed Web Originsは空にします。
Cross-Origin Authenticationも無効のままにします。

| 環境 | Allowed Callback URLs | Allowed Logout URLs |
| --- | --- | --- |
| Production | `https://private.s-hirano.com/api/auth/callback/auth0` | `https://private.s-hirano.com` |
| local | `http://localhost:3000/api/auth/callback/auth0` | `http://localhost:3000` |
| Preview | 下記2つのoriginに `/api/auth/callback/auth0` を付けたURL | 下記2つのorigin |

Previewの許可originは `https://s-private-*-s-hirano-ist-team.vercel.app` と
`https://memdex-web-*-s-hirano-ist-team.vercel.app` です。backendの公開URLを登録したり、
`https://*.vercel.app` のように別teamまで許可したりしません。

iOSはNative、RS256、token endpoint認証none、Authorization Code + PKCEと
Refresh Tokenを使用します。iOS APIのoffline accessを有効にし、clientのrefresh tokenは
rotation有効・最大2592000秒（30日）・未使用1296000秒（15日）・重複許容0秒とします。
MCPの設定は[参照専用MCPの設定](mcp-setup.md)を参照してください。

#### 2026-11-14の設定確認・適用状況

- dev WebのApplication種別、token endpoint認証、grant、URL制限、Web Originsは上記へ変更し、Dashboardで保存済みの状態を確認しました。既存client ID/secretは維持しています。
- Production iOSはImplicitを無効にし、上記の期限・rotationを保存しました。Native、認証none、callback、APIのoffline accessは維持しています。
- Production WebもOIDC準拠ON・Authorization Codeのみ・Web Originsなしへ変更しました。RS256、Client Secret Post、既存callback/Logout URLを維持し、Management APIの再取得で確認しています。devの実ログイン未検証を承知した上で適用しました。
- 変更後の本番 `/api/sign-in` からAuth0のログイン画面へ遷移することを確認しました。認証完了後のcallbackとログアウトの実操作は未検証です。MCPの実接続・refresh token交換の結果は[参照専用MCPの設定](mcp-setup.md)に記録しています。
- 既存Preview 2件と本PRのPreview backendで `500 FUNCTION_INVOCATION_FAILED` を再現し、起動時のS3必須5変数不足が原因と特定しました。Dopplerの `memdex-backend/stg` と同期先Vercel Previewの両方にS3変数がありませんでした。Vercel build時の実環境変数検証を追加し、不足したdeploymentがReadyになるのを防ぎます。
- 承認を得て非公開・暗号化有効のB2 bucket `memdex-preview-s-hirano-ist` とbucket限定キー `memdex-preview` を作成し、S3設定6件をDopplerへ登録・Vercel Previewへ同期しました。テストobjectの書込・読取・削除が成功し、backend再デプロイ後の `/health` は200、未認証sessionは401、Webの `/api/sign-in` はdev Auth0への307となり500が解消しました。clientとcallbackがdev／当該Previewであることも確認しました。
- Safariの同一フローで、dev Auth0ログイン完了・callback後の `/ja/articles` への遷移・保護された `/ja/settings` への遷移・サインアウト後のAuth0ログイン画面への戻りを確認しました。認証状態とURLのみを確認し、非公開記事の本文やCRUDは検証していません。
- 本番Database connectionはサインアップ禁止・改善された総当たり攻撃防御が有効です。tenantの不審IPスロットリング・総当たり攻撃防御も有効、ボット検知・パスワード漏洩検知は無効でした。今回これらは変更していません。
- 本番の `fetch-role` ActionはID tokenに `https://private.s-hirano.com/roles` claimを追加し、Node 18の古いruntime警告があります。リポジトリにclaimの利用箇所はありませんが、外部利用とトリガーへの接続状態が未確認のため削除していません。
- 本番の2つのAPI Test ApplicationはM2M clientです。利用履歴を確認できないため維持します。`All Applications` はtenantのグローバルclientであり、削除対象にしません。
- Connections全種別、devのActions/攻撃対策、利用ログの監査、iOS実機のログイン・更新・再起動・ログアウトは未完了です。API/DTO、DBのユーザー・Accountの紐付けは変更していません。

設定変更後はdevで認証を確認してからProductionへ適用し、iOS/MCPでは新規ログインに加えて
期限後のtoken更新も確認します。変更前の秘密値を含まない設定と、未検証の操作を記録し、
失敗時は直前の設定だけを戻します。client secretの再生成やユーザー移行は行いません。

`reset-*` / `revert-*` バッチは従来どおりDBトランザクションを実行します。

記事の OGP 画像URLはDB列と同じ4096文字まで受け付けます。OGP取得時と記事取り込み時に相対URLを記事URL基準の絶対URLへ解決し、絶対URLは切り詰めず保持します。OGP取得でリダイレクトした場合は最終応答URLを基準にします。

共通Prisma clientのトランザクション開始待ちは接続待ちと同じ10秒です。シリアライズ競合（`40001` / `P2034`）と、開始できなかったことを明示する `P2028` だけを最大5回、指数バックオフで再試行します。実行期限切れやコミット失敗など、その他の `P2028` は再試行しません。reset の一部が成功した後は、成功済みドメインを再実行せず未実行分だけを復旧してください。

Webのコンテンツ取得は共通backend経由の `no-store` のため、更新後の内部キャッシュ無効化API呼び出しと専用secretは不要です。

### Web Push と Vercel Cron

Production の Vercel Environment Variables に次を設定します。秘密鍵と Cron secret はリポジトリや Preview 環境へ保存しません。

| 変数 | 用途 |
|---|---|
| `CRON_SECRET` | Vercel Cron Route の Bearer token（16文字以上のランダム値） |
| `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` | ブラウザへ公開する VAPID 公開鍵 |
| `WEB_PUSH_PRIVATE_KEY` | Web Push 署名用 VAPID 秘密鍵 |
| `WEB_PUSH_SUBJECT` | VAPID の連絡先（例: `mailto:admin@example.com`） |

VAPID 鍵は `pnpm --filter @s-hirano-ist/s-notification exec web-push generate-vapid-keys` で生成します。公開鍵と秘密鍵は必ず同じ組をbackendへ登録してください。ブラウザは認証付き状態APIからbackendの公開鍵を取得し、Web側の環境変数は参照しません。通常の復旧では鍵を再生成しません。

鍵不一致の復旧手順:

1. `7_push_subscription_renewal` migrationをアプリ切替前に適用します（既存購読は配信継続）。
2. backendの秘密鍵から公開鍵を導出して設定公開鍵との一致を、値を表示せず確認します。設定不足・不一致は状態API・登録・送信を503にするため、是正をリリース条件とします。VercelのSensitive変数は読み戻せないので、権限のある実行環境で確認します。
3. Appleの400 `VapidPkHashMismatch` が発生すると、その購読はDBに残して配信停止します。Cronの `requiresResubscribe` は今回の該当件数です。一般的な400・401・403は停止対象ではありません。
4. 対象端末の通知設定で「再登録」を押します。旧購読解除が失敗したら先へ進みません。新購読のDB保存だけ失敗した場合は、同じ画面から保存を再試行できます。
5. 明示的に「テスト通知」を送り受信を確認し、次回Cronの正常配信と同じ鍵不一致の再発停止を確認します。

配信停止はエラー再発を抑止する処理であり、端末で再登録・受信確認するまでは通知復旧と区別します。Safari/iOSの実機確認が必要です。

Cronは共通backendだけが担当し、Production用scheduleは `apps/backend/vercel.json` に登録します。旧Webのscheduleを停止した後、backendのProductionに `CRON_SECRET` と `BACKEND_CRON_ENABLED=true` を設定してください。Previewは `BACKEND_CRON_ENABLED=false` を維持します。具体的な順序・環境変数・確認方法は [共通backendの配置と手動切替](backend-deployment.md) を参照してください。

## Database (CockroachDB)

DB ホスティングは **CockroachDB Cloud Basic**（region `gcp-asia-southeast1`）を使用します。Prisma ORM (`provider = "cockroachdb"`) 経由で接続し、`@prisma/adapter-pg` (node-postgres) で pgwire プロトコルで話します（CockroachDB は PostgreSQL ワイヤ互換）。

### 接続URLの構成

CockroachDB Cloud Basic は接続プーリングが内蔵で、pooled / direct の二重エンドポイントを持ちません。よってアプリ実行も `prisma deploy` も `DATABASE_URL` 1本で足ります:

| 変数 | 用途 | 備考 |
|---|---|---|
| `DATABASE_URL` | アプリ実行 + `prisma deploy` | `postgresql://<user>:<password>@<host>:26257/<db>?sslmode=verify-full` |

- TLS は `sslmode=verify-full`。CockroachDB Cloud のサーバ証明書はパブリック CA のため Node.js の `rootCertificates` で検証できます。

### CockroachDB の `schema_locked` とマイグレーション

> ⚠️ **重要**: `sql.defaults.create_table_with_schema_locked = true` の環境では、新規テーブルがロック状態で作られます。Prisma はマイグレーションファイル全体を **1トランザクション** で流すため、`CREATE TABLE` 直後の `CREATE INDEX` / `ALTER TABLE ADD FOREIGN KEY` が「table is locked」(`P3018` / SQLSTATE `57000`) で失敗します。

対応: **マイグレーション SQL の各 `CREATE TABLE` に `WITH (schema_locked = false)` を付与**する（設定権限に依存せず確実）。初期 baseline (`0_init`) は対応済み。後述の diff フローで新規テーブルを追加するときも必ず付与してください（既存テーブルへの `ALTER` は、そのテーブルが unlocked で作られていれば不要）。

### マイグレーションの運用（重要: `migrate dev` は封印）

> ⚠️ **クラウド（dev-db / staging / prod）には `prisma migrate deploy` のみを使い、`prisma migrate dev` は使いません。**
> CockroachDB Cloud は単一リージョンでも multi-region メタデータ enum `crdb_internal_region` を保持し、`migrate dev` / `migrate status` がこれを schema drift と誤検出して `DROP TYPE` を試み、`P3018` / `2BP01` で失敗します（[prisma#25696](https://github.com/prisma/prisma/issues/25696)）。クラウド環境への適用は引き続き`migrate deploy`のみを使います。

**ローカル開発はDocker上の単一ノードCockroachDB**を使用し、`pnpm dev`が`migrate deploy`を適用します。新しいmigrationは既存スキーマとの **diffフロー**で生成します:

> ⚠️ **注意**: `prisma:migrate:diff` スクリプト（`prisma migrate diff --from-migrations ...`）はマイグレーションを replay するために shadow database (`datasource.shadowDatabaseUrl`) を要求するため、そのままでは DB 接続なしには動きません。DB 接続なしで差分を生成するには、下記のように git HEAD のスキーマと現スキーマを `--from-schema` で直接比較してください。

1. `packages/database/prisma/schema.prisma` を編集
2. 差分 SQL を生成（git HEAD のスキーマと現スキーマを比較。DB 接続不要）:

   ```bash
   cd packages/database
   git show HEAD:packages/database/prisma/schema.prisma > /tmp/old-schema.prisma
   mkdir -p "prisma/migrations/$(date +%Y%m%d%H%M%S)_<name>"
   pnpm exec prisma migrate diff \
     --from-schema /tmp/old-schema.prisma \
     --to-schema prisma/schema.prisma \
     --script > "prisma/migrations/<dir>/migration.sql"
   ```

3. 生成 SQL の**新規 `CREATE TABLE` に `WITH (schema_locked = false)` を付与**
4. コミット → クラウドへ `pnpm --filter s-database prisma:deploy`

モバイル差分同期の `CREATE TRIGGER` は CockroachDB の制約により Prisma のマイグレーショントランザクション内で実行できません。`prisma:deploy` スクリプトはマイグレーション適用後に各トリガーを独立した SQL 文で作成します。再実行しても既存トリガーは重複作成しません。トリガーを含むデプロイでは `prisma migrate deploy` を直接実行せず、上記の `prisma:deploy` スクリプトを使用してください。

## Web・共通backendのVercel配置

Webと共通Hono backendは別projectに配置します。Root Directory、workspaceビルド、環境変数の分担、Auth0 callback、Deployment Protection、段階切替、Cron、rollbackは [Vercelセットアップ手順](backend-vercel-setup.md) を参照してください。デプロイは担当者が手動で行います。

## オブジェクトストレージ

本番・PreviewはBackblaze B2、ローカルはMinIOを使用する。AWS SDK v3を使い、
`S3_*`変数で接続する。会員登録・キー発行・環境設定・ingestの手順は
[Backblaze B2セットアップ](backblaze-b2-setup.md)を参照。

## GitHub Actions dependencies

Workflow の通常の action は完全なバージョンタグで参照し、
`.github/workflows/actions.lock` でコミットとリポジトリの identity、推移依存を固定します。
lockfile は生成物です。手で編集しないでください。

```bash
gh extension install github/gh-actions-lock --pin v0.4.1
gh actions-lock --migrate-local-actions
gh actions-lock --verify
```

同一リポジトリの composite action は `$/` で workflow のコミットから読み込みます。
checkout は実行するコマンドのために引き続き必要です。Node と pnpm は既存の
`setup-pnpm` action に集約し、`pnpm-lock.yaml` を frozen install します。
composite action 定義内の外部参照は、単独利用時の保護と lint のため SHA 固定を維持します。
生成ツールがタグへ変換した場合は、対応する同じコミット SHA とバージョンコメントへ戻し、
`gh actions-lock --no-interactive --no-onboard --no-narrow --ignore-local-actions` で記録してから
再検証します。workflow と composite、lockfile の差分を一緒にレビューしてください。

外部 reusable workflow の呼び出し自体は lockfile の対象外なので SHA 固定を維持します。
内部の action は共有元リポジトリの lockfile で管理します。
Docker image と `run:` 内で取得するツールも Actions lockfile の対象外です。
`gh-actions-lock` 自体は検証 workflow で v0.4.1 に固定しています。

Renovate が action の更新と lockfile の再生成を同じ PR で行います。
通常 workflow の action はタグ、composite は SHA の更新方式を使います。
更新時は `gh actions-lock --verify` と actionlint・ghalint・zizmor の成功を確認してください。
ghalint は lockfile 対応の v1.6.0、zizmor は v1.32.0 を使用します。
actionlint v1.7.12 の未対応構文に対する例外は、`$/` による自リポジトリ action の診断だけに限定しています。

`verify-actions-lockfile` は全 PR と main push で、ファイルを書き換えず検証します。
依存の追加・削除時にも生成を実行し、全 workflow を登録してください。
タグ移動は upstream の履歴を確認し、通常の更新では解決しない場合だけ手動で `--relock` します。
`--relock` や `--accept-moved` を自動更新処理には追加しません。

公式資料: [GitHub workflow lockfiles](https://docs.github.com/en/actions/concepts/security/workflow-dependency-lockfiles)、
[gh-actions-lock](https://github.com/github/gh-actions-lock)、
[Renovate GitHub Actions](https://docs.renovatebot.com/modules/manager/github-actions/)。

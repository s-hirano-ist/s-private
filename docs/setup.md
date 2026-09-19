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

## Environment Variables

ローカル環境はコミット済みの `.env.local`、Preview/ProductionはVercel Dashboardで管理します。ローカルファイルには外部環境で通用する秘密値を置きません。

### セットアップ

Miseはプロジェクトルートの`.env.local`を読み込みます。`pnpm dev`はMiseの有無にかかわらず同ファイルを明示的に読み込み、Docker Compose起動、migration、検索初期化、Next.js起動を順番に実行します。

ローカルでは固定開発ユーザーを初回アクセス時に作成して自動ログインします。Vercelでは`LOCAL_DEV_MODE`を無視し、Auth0のみを使用します。

### 変数一覧

環境変数のスキーマと型定義は `app/src/env.ts`（`@t3-oss/env-nextjs` + Zod）を参照してください。
Docker Compose 用の変数（VPS デプロイ時）は [docs/vps-deployment.md Step 7](vps-deployment.md) を参照してください。

### Auth0 callback URL

Auth0 Dashboard の Application Settings で、各環境の公開URLに対応する次のURLを **Allowed Callback URLs** に登録します。

```text
https://<application-origin>/api/auth/callback/auth0
```

Better Auth 1.7ではGeneric OAuthも標準のsocial provider callbackを使用します。旧URLの
`/api/auth/oauth2/callback/auth0`は使用しません。

外部の `reset-*` / `revert-*` バッチから Next.js のキャッシュを無効化する場合は、次の変数も設定します。

| 変数 | 用途 |
|---|---|
| `CACHE_INVALIDATION_SECRET` | アプリとバッチで共有する内部 API の Bearer token（`openssl rand -base64 32` などで生成） |
| `CACHE_INVALIDATION_URL` | バッチ側のみ。デプロイ済みアプリの `/api/internal/cache/invalidate` の絶対 URL |

バッチの DB トランザクション成功後に内部 API を呼び出します。呼び出しに失敗した場合、DB 更新はロールバックされませんが、バッチ自体は失敗終了し、標準エラーと Pushover 通知に失敗を残します。

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

# Development Setup

## Quick Start

```bash
mise install         # Node.js, pnpm, Doppler CLI 等をインストール
pnpm install
vercel link          # 初回のみ: Vercel プロジェクトをリンク（prisma/docker用）
pnpm docker:up       # Docker Compose 起動（環境変数は Vercel dev から注入）
pnpm dev             # 開発サーバー起動（環境変数は Doppler から注入）
```

## Mise Configuration

This project uses [Mise](https://mise.jdx.dev/) for tool version management.

- **Node.js** のバージョンは `.nvmrc` を Single Source of Truth とし、Mise は `.mise.toml` の `idiomatic_version_file_enable_tools = ["node"]` 設定によりこれを読み込みます。`package.json#engines.node` は Vercel と pnpm 用のミラーで、CI で `.nvmrc` との一致が検証されます。Vercel ダッシュボードの Node.js Version 設定も同じメジャー (24.x) に揃えてください。
- **pnpm / Doppler CLI** など他ツールのバージョンは `.mise.toml` の `[tools]` で定義されています。

1. [Mise](https://mise.jdx.dev/getting-started.html) をインストール
2. プロジェクトルートで以下を実行:
   ```bash
   mise install
   ```

**Note**: Mise はプロジェクトディレクトリに入ると `.mise.toml` で指定されたツールバージョンを自動的に使用します。また、`.env.local` の環境変数も自動的に読み込みます（`_.file = ".env.local"`）。

## Environment Variables

環境変数は **dev/preview 環境は Doppler**、**本番環境は Vercel Dashboard** で管理します。ローカルに `.env` ファイルを置く必要はありません。

> Vercel CLI に一本化しない理由: `vercel env run` は dev 環境から本番環境の変数にもアクセスできてしまうため、セキュリティ上 dev/preview は Doppler で分離しています。

### セットアップ

`.env.local` に Doppler サービストークンを設定します。サービストークンにはプロジェクト・環境情報が含まれるため、`doppler login` / `doppler setup` は不要です。

```bash
# .env.local（プロジェクトルート）
DOPPLER_TOKEN=dp.st.dev.xxxxxxxxxxxx
```

サービストークンは [Doppler Dashboard](https://dashboard.doppler.com/) > プロジェクト > dev 環境 > Access > Service Tokens から発行できます。

Mise が `.env.local` を自動読み込みし（`.mise.toml` の `_.file = ".env.local"`）、`doppler run` が `DOPPLER_TOKEN` を検出して環境変数を取得します。

以降、`pnpm dev` 等の app スクリプトは Doppler から、`pnpm prisma:*` / `pnpm docker:up` 等のルートスクリプトは Vercel dev 環境から環境変数を取得します。

任意のコマンドに環境変数を注入したい場合:
```bash
doppler run -- <command>                     # dev/preview 環境変数
vercel env run -e development -- <command>   # Vercel dev 環境変数（DB/Docker用）
```

### 変数一覧

環境変数のスキーマと型定義は `app/src/env.ts`（`@t3-oss/env-nextjs` + Zod）を参照してください。
Docker Compose 用の変数（VPS デプロイ時）は [docs/vps-deployment.md Step 7](vps-deployment.md) を参照してください。

## Database (CockroachDB)

DB ホスティングは **CockroachDB Cloud Basic (Serverless)** を使用します。Prisma ORM (`provider = "cockroachdb"`) 経由で接続し、`@prisma/adapter-pg` (node-postgres) で pgwire プロトコルで話します（CockroachDB は PostgreSQL ワイヤ互換）。

### 接続URLの構成

CockroachDB Cloud Basic は接続プーリングが内蔵で、pooled / direct の二重エンドポイントを持ちません。よってアプリ実行も `prisma migrate` も `DATABASE_URL` 1本で足ります:

| 変数 | 用途 | 備考 |
|---|---|---|
| `DATABASE_URL` | アプリ実行 + `prisma migrate` | `postgresql://<user>:<password>@<host>:26257/<db>?sslmode=verify-full` |

- TLS は `sslmode=verify-full`。CockroachDB Cloud のサーバ証明書はパブリック CA のため Node.js の `rootCertificates` で検証できます。

### CockroachDB v26.1+ の `schema_locked` とマイグレーション

> ⚠️ **重要**: CockroachDB v26.1 以降は `sql.defaults.create_table_with_schema_locked = true` がデフォルトで、新規テーブルがロック状態で作られます。Prisma はマイグレーションファイル全体を **1トランザクション** で流すため、`CREATE TABLE` 直後の `CREATE INDEX` / `ALTER TABLE ADD FOREIGN KEY` が「table is locked」(`P3018` / SQLSTATE `57000`) で失敗します。

対応: **マイグレーション SQL の各 `CREATE TABLE` に `WITH (schema_locked = false)` を付与**する（設定権限に依存せず確実）。初期 baseline (`0_init`) は対応済み。後述の diff フローで新規テーブルを追加するときも必ず付与してください（既存テーブルへの `ALTER` は、そのテーブルが unlocked で作られていれば不要）。

### マイグレーションの運用（重要: `migrate dev` は封印）

> ⚠️ **クラウド（dev-db / staging / prod）には `prisma migrate deploy` のみを使い、`prisma migrate dev` は使いません。**
> CockroachDB Cloud は単一リージョンでも multi-region メタデータ enum `crdb_internal_region` を保持し、`migrate dev` / `migrate status` がこれを schema drift と誤検出して `DROP TYPE` を試み、`P3018` / `2BP01` で失敗します（[prisma#25696](https://github.com/prisma/prisma/issues/25696)）。`migrate deploy` は drift を見ないため影響を受けません。`prisma:migrate` には `DATABASE_URL` が localhost 以外なら停止するガードを設定済みです。

**ローカル開発はクラウドの dev-db クラスタに直結**します（ローカル DB は不要）。新しい migration は **DB 不要の diff フロー**で生成します:

1. `packages/database/prisma/schema.prisma` を編集
2. 差分 SQL を生成（`prisma migrate diff` は DB 接続不要）:
   ```bash
   mkdir -p "prisma/migrations/$(date +%Y%m%d%H%M%S)_<name>"
   pnpm --filter s-database prisma:migrate:diff -o "prisma/migrations/<dir>/migration.sql"
   ```
3. 生成 SQL の**新規 `CREATE TABLE` に `WITH (schema_locked = false)` を付与**
4. コミット → クラウドへ `pnpm --filter s-database prisma:deploy`

> `compose.yaml` の単一ノード CockroachDB (insecure) は **任意の migration 検証用**に残してあります。
> 使う場合は `DATABASE_URL=postgresql://root@localhost:26257/defaultdb?sslmode=disable` を向けて
> `prisma:deploy` で適用します（localhost なら `migrate dev` も可）。

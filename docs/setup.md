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

CockroachDB Cloud Basic は接続プーリングが内蔵で、Supabase の Supavisor のような pooled / direct の二重エンドポイントを持ちません。よって URL は1本で足ります:

| 変数 | 用途 | 備考 |
|---|---|---|
| `DATABASE_URL` | アプリ実行 + `prisma migrate` | `postgresql://<user>:<password>@<host>:26257/<db>?sslmode=verify-full` |
| `DIRECT_URL` | （任意）migrate 用 | 未設定なら `DATABASE_URL` にフォールバック（[resolve-db-env.ts](../packages/database/src/resolve-db-env.ts)） |

- TLS は `sslmode=verify-full`。CockroachDB Cloud のサーバ証明書はパブリック CA のため Node.js の `rootCertificates` で検証でき、Supabase 時に必要だった `sslmode=no-verify` ハックは不要です。

### CockroachDB v26.1+ の `schema_locked` とマイグレーション

> ⚠️ **重要**: CockroachDB v26.1 以降は `sql.defaults.create_table_with_schema_locked = true` がデフォルトで、新規テーブルがロック状態で作られます。Prisma はマイグレーションファイル全体を **1トランザクション** で流すため、`CREATE TABLE` 直後の `CREATE INDEX` / `ALTER TABLE ADD FOREIGN KEY` が「table is locked」(`P3018` / SQLSTATE `57000`) で失敗します。

対応（いずれか。本リポジトリは方法1を採用）:

1. **マイグレーション SQL の各 `CREATE TABLE` に `WITH (schema_locked = false)` を付与**（設定権限に依存せず確実）。`prisma migrate diff` 生成後に手動で付与します。初期 baseline (`0_init`) は対応済み。
2. migrate 用ロールに `ALTER ROLE <user> SET create_table_with_schema_locked = false;` を一度設定（権限があれば、以後 `prisma migrate dev` は無加工で動く）。

**新しいマイグレーションを追加するとき** (`pnpm --filter s-database prisma:migrate`)、生成された `migration.sql` の新規 `CREATE TABLE` に `WITH (schema_locked = false)` を必ず追記してください（既存テーブルへの `ALTER` は、そのテーブルが unlocked で作られていれば追記不要）。

### ローカル dev 環境

ローカルは `compose.yaml` の単一ノード CockroachDB (insecure) を使います:

```bash
docker compose up -d --wait cockroachdb
# DATABASE_URL=postgresql://root@localhost:26257/defaultdb?sslmode=disable
pnpm --filter s-database prisma:deploy   # マイグレーション適用
```

個人ごとにクラウド環境が欲しい場合は [CockroachDB Cloud](https://cockroachlabs.cloud/) で Basic クラスタを作成し、接続文字列を Doppler の personal config に設定します。

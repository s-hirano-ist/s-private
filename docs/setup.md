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

This project uses [Mise](https://mise.jdx.dev/) for tool version management. Node.js, pnpm, Doppler CLI 等のバージョンは `.mise.toml` で定義されています。

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

## Database (Supabase Postgres)

DB ホスティングは Supabase Postgres を使用します。Prisma ORM 経由で接続し、`@prisma/adapter-pg` (node-postgres) で直接 Postgres に話します。

### 接続URLの構成

`DATABASE_URL` と `DIRECT_URL` の2系統を Doppler に登録します:

| 変数 | 用途 | ポート | モード |
|---|---|---|---|
| `DATABASE_URL` | アプリ実行用 (Server Actions, API) | 6543 | Transaction Pooler (Supavisor) |
| `DIRECT_URL` | `prisma migrate` 専用 | 5432 | Direct or Session Pooler |

`prisma migrate` は advisory lock を取るため transaction mode では動かず、必ず Direct/Session を使います。アプリ実行時は serverless 向けに Transaction Pooler を使います。

### 個人 dev 環境 (Free tier)

開発者ごとに個人 Supabase プロジェクトを作るのを推奨します。共有 dev プロジェクトを使うと並列作業時に壊れやすいためです。

1. [Supabase Dashboard](https://supabase.com/dashboard) で `s-private-dev-<name>` プロジェクトを作成。
2. プロジェクトの **Connect** から `Transaction pooler` (6543) と `Session pooler` または `Direct connection` (5432) の URL を取得。
3. Doppler の personal config (`dev_<name>`) に以下を設定:
   ```
   DATABASE_URL=<Transaction Pooler URL :6543>
   DIRECT_URL=<Direct or Session URL :5432>
   ```
4. 初回だけ migrate を流す:
   ```bash
   pnpm --filter s-database prisma:deploy
   ```
5. Free tier は7日間無アクセスで pause されるので、定期的に Studio を開くか、軽量 ping で起動状態を保ちます。

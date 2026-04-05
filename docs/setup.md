# Development Setup

## Quick Start

```bash
pnpm install
vercel link          # 初回のみ: Vercel プロジェクトをリンク
pnpm docker:up       # Docker Compose 起動（環境変数は Vercel から注入）
pnpm dev             # 開発サーバー起動（環境変数は Vercel から注入）
```

## Mise Configuration

This project uses [Mise](https://mise.jdx.dev/) for Node.js and package manager version management. The tools and their versions are defined in `.mise.toml`.

To set up your environment:

1. Install [Mise](https://mise.jdx.dev/getting-started.html)
2. Run the following command in the project root to install the required tools:
   ```bash
   mise install
   ```

**Note**: Once installed, Mise will automatically use the correct Node.js and pnpm versions specified in `.mise.toml` when you enter the project directory.

## Local PostgreSQL (Docker + mise tasks)

Vercel 経由のクラウドDBとは別に、Docker + mise タスクでローカル PostgreSQL を利用できます。

```bash
mise run db:up            # PostgreSQL コンテナ起動
mise run db:deploy        # 既存マイグレーションを適用
mise run db:migrate       # Prisma migrate dev 実行（新規マイグレーション作成）
mise run db:studio        # Prisma Studio 起動
mise run db:status        # コンテナ状態確認
mise run db:down          # コンテナ停止
mise run db:destroy       # コンテナ・ボリューム完全削除
```

ローカル PostgreSQL はポート **15432** で起動します（システム PostgreSQL との競合回避）。
接続URL: `postgresql://s_private:s_private@localhost:15432/s_private?schema=public`

**注意**: ローカル PostgreSQL は Prisma CLI 操作（migrate, studio）用です。Next.js アプリのランタイムは引き続き Vercel 経由のクラウドDBを使用します。

## Environment Variables

環境変数は **Vercel Dashboard** で一元管理し、ローカルに `.env` ファイルを置く必要はありません。

### セットアップ

1. [Vercel Dashboard](https://vercel.com) で対象プロジェクトの Environment Variables を設定
2. ローカルで `vercel link` を実行してプロジェクトをリンク（初回のみ）

以降、`pnpm dev` / `pnpm docker:up` / `pnpm prisma:studio` 等のスクリプトは自動的に Vercel から環境変数を取得します。

任意のコマンドに環境変数を注入したい場合:
```bash
vercel env run -e development -- <command>
```

### 変数一覧

環境変数のスキーマと型定義は `app/src/env.ts`（`@t3-oss/env-nextjs` + Zod）を参照してください。
Docker Compose 用の変数（VPS デプロイ時）は [docs/vps-deployment.md Step 7](vps-deployment.md) を参照してください。ローカル開発では `vercel env run` 経由で自動注入されるため、別途設定は不要です。

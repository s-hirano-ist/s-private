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

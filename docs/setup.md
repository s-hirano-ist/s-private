# Development Setup

## Quick Start

```bash
pnpm install
doppler login        # 初回のみ: Doppler にログイン
doppler setup        # 初回のみ: プロジェクト・環境を選択
pnpm docker:up       # Docker Compose 起動（環境変数は Doppler から注入）
pnpm dev             # 開発サーバー起動（環境変数は Doppler から注入）
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

## Environment Variables

環境変数は **Doppler** で一元管理し、ローカルに `.env` ファイルを置く必要はありません。

### セットアップ

1. [Doppler CLI](https://docs.doppler.com/docs/install-cli) をインストール
2. `doppler login` でログイン（初回のみ）
3. プロジェクトルートで `doppler setup` を実行し、プロジェクト・環境を選択（初回のみ）

以降、`pnpm dev` / `pnpm docker:up` / `pnpm prisma:studio` 等のスクリプトは自動的に Doppler から環境変数を取得します。

任意のコマンドに環境変数を注入したい場合:
```bash
doppler run -- <command>
```

### 変数一覧

環境変数のスキーマと型定義は `app/src/env.ts`（`@t3-oss/env-nextjs` + Zod）を参照してください。
Docker Compose 用の変数（VPS デプロイ時）は [docs/vps-deployment.md Step 7](vps-deployment.md) を参照してください。ローカル開発では `doppler run` 経由で自動注入されるため、別途設定は不要です。

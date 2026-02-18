# CLAUDE.md

Next.js 16 + TypeScript + Clean Architectureベースのコンテンツ管理システム。
docs/** にはより詳細な設計等のルールが記載されています。必要に応じて参照してください。
また、新たな設計パターンを追加する場合は、docs/** の設計該当箇所に適宜内容を追加してください。

- Before doing any UI, frontend or React development, ALWAYS call the storybook MCP server to get further instructions.
- issuesには、取り組み検討中の課題を記述している。issueに取り組むように指示があり、完了したらissueは削除すること。
- 計画時、後方互換性は基本的に捨てること。

## 技術スタック
- Next.js 16 (App Router, Server Actions)
- TypeScript + Zod
- Prisma + PostgreSQL
- Shadcn/ui + Tailwind CSS
- Auth0 + Auth.js
- MinIO (Object Storage)
- Qdrant (Vector Database) + Embedding API (Hono)

## コマンド
- `pnpm dev` - 開発サーバー
- `pnpm build` - ビルド
- `pnpm test` - テスト実行
- `pnpm lint:fix` - ESLint修正
- `pnpm check:fix` - Biomeフォーマット
- `pnpm prisma:migrate` - DBマイグレーション
- `pnpm storybook` - Storybook起動

## ディレクトリ構造
- `packages/core/` - ドメイン層（entities, repositories, services, shared-kernel）
- `packages/ui/` - 共有UIコンポーネント（shadcn/ui, forms, hooks等）
- `packages/scripts/` - ビルド・ユーティリティスクリプト
- `app/src/application-services/` - アプリケーション層
- `app/src/infrastructures/` - インフラ層（Prisma実装、DI factories）
- `app/src/loaders/` - データローダー層
- `packages/search/` - RAG検索ライブラリ（Qdrant・Embedding APIクライアント）
- `services/embedding-api/` - Embedding APIサービス（Hono + HuggingFace Transformers）
- `app/src/app/[locale]/` - Next.js App Router（i18n対応: en/ja）

## 主要ドメイン
`articles`, `notes`, `images`, `books` - 各コンテンツのCRUDと状態管理（UNEXPORTED → EXPORTED）

## 設計方針
- Clean Architecture + ドメイン駆動設計
- Server Actionsで全mutation（`wrapServerSideErrorForClient`使用）
- 各ドメインは独立（cross-domain import禁止）
- Zod schemaで入力バリデーション
- 絶対パスimport必須（`../../*`禁止）

## 外部サービス
- PostgreSQL + Prisma ORM
- MinIO（オブジェクトストレージ）
- Sentry（エラー監視）+ Pushover（通知）
- Auth0 + uth.js（認証）
- next-intl（i18n）
- Embedding API（ConoHa VPS + Cloudflare Tunnel）
- Qdrant（ベクトルデータベース）

## 環境設定
`app/.env.sample` → `.env.local`にコピー。型定義は`app/src/env.ts`。

## 詳細資料
- セットアップ: [docs/setup.md](docs/setup.md)
- テスト: [docs/testing.md](docs/testing.md)
- アーキテクチャ: [docs/architecture.md](docs/architecture.md)
- ドメインモデル: [docs/domain-model.md](docs/domain-model.md)
- セキュリティ: [SECURITY.md](SECURITY.md)
- VPSデプロイ: [docs/vps-deployment.md](docs/vps-deployment.md)
- スキーマ: [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)

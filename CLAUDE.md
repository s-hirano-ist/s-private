# CLAUDE.md

Next.js 15 + TypeScript + Clean Architectureベースのコンテンツ管理システム。

Before doing any UI, frontend or React development, ALWAYS call the storybook MCP server to get further instructions.

## 技術スタック
- Next.js 15 (App Router, Server Actions)
- TypeScript + Zod
- Prisma + PostgreSQL
- Shadcn/ui + Tailwind CSS
- Auth0 + NextAuth.js
- MinIO (Object Storage)

## コマンド
- `pnpm dev` - 開発サーバー
- `pnpm build` - ビルド
- `pnpm test` - テスト実行
- `pnpm lint:fix` - ESLint修正
- `pnpm check:fix` - Biomeフォーマット
- `pnpm prisma:migrate` - DBマイグレーション
- `pnpm storybook` - Storybook起動

## ディレクトリ構造
- `src/domains/` - ドメイン層（entities, repositories, services）
- `src/application-services/` - アプリケーション層
- `src/infrastructures/` - インフラ層（Prisma実装）
- `app/[locale]/` - Next.js App Router（i18n対応: en/ja）

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
- Auth0 + NextAuth.js（認証）
- next-intl（i18n）

## 環境設定
`.env.sample` → `.env.local`にコピー。型定義は`src/env.ts`。

## 詳細資料
- セットアップ: [docs/setup.md](docs/setup.md)
- テスト: [docs/testing.md](docs/testing.md)
- アーキテクチャ: [docs/architecture.md](docs/architecture.md)
- ドメインモデル: [docs/domain-model.md](docs/domain-model.md)
- セキュリティ: [SECURITY.md](SECURITY.md)
- スキーマ: [prisma/schema.prisma](prisma/schema.prisma)

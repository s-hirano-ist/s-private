# Repository Agent Instructions

Next.js + TypeScript + Clean Architectureベースのコンテンツ管理システム。
`docs/**` にはより詳細な設計等のルールが記載されています。必要に応じて参照してください。
また、新たな設計パターンを追加する場合は、`docs/**` の設計該当箇所に適宜内容を追加してください。

- UI、frontend、Reactの開発前に、必ず現在のworktreeで`pnpm exec storybook skills stories`を実行し、その指示に従うこと。コンポーネントまたはstoryを作成・編集する前には`pnpm exec storybook skills write-story`も実行すること。
- Storybookの調査、変更検出、テスト、レビューには`pnpm exec storybook tools ...`を使用する。直接Storybook MCPツールが公開されていることを前提にしない。`[requires running Storybook]`と表示される操作でのみ`pnpm storybook:agent`を起動し、ポートを固定せず、現在のworktreeからCLIに対象instanceを解決させること。
- 課題管理は GitHub Issues で行う。新しい課題を登録する前に既存 Issue との重複を確認し、対応が完了したら Issue をクローズすること。
- 計画時、後方互換性は基本的に捨てること。
- ハーネス共通資産の正本は `.harness/` に置く。`AGENTS.md`、`CLAUDE.md`、`.agents/skills/`、`.claude/skills/` のリンク先を直接編集しないこと。
- Skillを追加・削除したら `pnpm harness:sync` でリンクを同期し、`pnpm harness:check` で検証すること。
- `ios/`配下のSwiftUIアプリを変更、ビルド、テスト、Simulatorデバッグするときは`develop-ios-app` Skillを使用する。現在のworktree内のXcode projectとDerivedDataだけを使い、主checkoutや別worktreeの生成物を参照しないこと。

## 技術スタック

- Next.js (App Router, Server Actions)
- TypeScript + Zod
- Prisma + CockroachDB
- Shadcn/ui + Tailwind CSS
- Auth0 + Auth.js
- MinIO (Object Storage)
- Qdrant (Vector Database) + HuggingFace TEI (Text Embeddings Inference)

## コマンド

- `pnpm dev` - 開発サーバー
- `pnpm build` - ビルド
- `pnpm check:agent` - AIエージェント向けの標準完了検証（format、typecheck、lint、依存境界、packages build、test）
- `pnpm test` - テスト実行
- `pnpm lint` - oxlint（TypeScript/JavaScript、type-aware）+ ESLint（YAML/JSON）
- `pnpm lint:fix` - oxlint + ESLint自動修正
- `pnpm lint:md` - rumdl（Markdown）
- `pnpm lint:secret` - Gitleaks（秘密情報）
- `pnpm deps:check` - dependency-cruiser（Clean Architecture層境界の強制を含む）
- `pnpm format` - oxfmt（Prettier互換。フォーマット + import並べ替え + Tailwindクラス並べ替え。Biomeから移行済み）
- `pnpm format:check` - oxfmtフォーマットチェック（書き込みなし）
- `pnpm --filter s-database prisma:migrate:diff` - 新規マイグレーションSQL生成（既存マイグレーション群とschema.prismaのdiff。ルートにスクリプトは無く packages/database にのみ存在。`--from-migrations` はシャドウDBを必要とする。`migrate dev` はクラウドの `crdb_internal_region` drift で失敗するため不使用）
- `pnpm prisma:deploy` - マイグレーション適用（クラウドはこちらを使う）
- `pnpm storybook` - Storybook起動
- `pnpm storybook:agent` - AIエージェント向けにStorybookを非対話で空きポートに起動
- `mise run ios:generate` - 現在のworktree内にXcodeプロジェクトを生成
- `mise run ios:build` - iOS 27 Simulator向けビルド
- `mise run ios:test` - iOS単体テストとUIテスト
- `mise run ios:run` - iPhone 17 Simulatorへインストールして起動

## AIエージェントの完了検証

- コードを変更したタスクでは、完了を報告する前に `pnpm check:agent` を成功させること。
- アプリのビルド、環境設定、データベース、E2Eに関係する変更では、`pnpm check:agent` に加えて変更内容に対応する `pnpm build`、Prisma、Playwright等の検証も実行すること。
- 長時間タスクで自動的に実装・検証・修正を反復する場合だけ Codex の `/goal` を使い、目的、変更範囲、検証コマンド、停止条件を明記すること。
- 外部承認や外部サービス障害で検証できない場合は無限に再試行せず、実行済みの検証とブロッカーを報告すること。

## ディレクトリ構造

- `packages/core/` - ドメイン層（entities, repositories, services, shared-kernel）
- `packages/ui/` - React 19汎用デザインシステム（Next.js・アプリ固有ロジック禁止、明示的subpath exports）
- `packages/database/` - データベース層（Prisma ORM・マイグレーション）
- `packages/notification/` - 通知サービス（Pushover）
- `packages/storage/` - MinIOストレージクライアント
- `packages/scripts/` - ビルド・ユーティリティスクリプト
- `app/src/application-services/` - アプリケーション層
- `app/src/infrastructures/` - インフラ層（Prisma実装、DI factories）
- `app/src/loaders/` - データローダー層
- `packages/search/` - RAG検索ライブラリ（Qdrant・Embedding APIクライアント）
- `app/src/app/[locale]/` - Next.js App Router（i18n対応: en/ja）

## 主要ドメイン

`articles`, `notes`, `images`, `books` - 各コンテンツのCRUDと状態管理（UNEXPORTED → LAST_UPDATED → EXPORTED）

## 設計方針

- Clean Architecture + ドメイン駆動設計
- Server Actionsで全mutation（`wrapServerSideErrorForClient`使用）
- 認証済みiOSクライアント向けの `/api/mobile/v1` のmutationはRoute Handlerを例外とする。Bearer認証・所有者検証・tenant contextを入口で確立し、既存ユースケースとドメインルールを共有する。
- 各ドメインは独立（cross-domain import禁止）
- Zod schemaで入力バリデーション
- 絶対パスimport必須（`../../*`禁止）

## 外部サービス

- CockroachDB Cloud + Prisma ORM
- MinIO（オブジェクトストレージ）
- Sentry（エラー監視）+ Pushover（通知）
- Auth0 + Auth.js（認証）
- next-intl（i18n）
- HuggingFace TEI（Docker / ConoHa VPS + Cloudflare Tunnel）
- Qdrant（ベクトルデータベース）

## 環境設定

環境変数はローカル環境では`.env.local`、Preview/Production環境ではVercel Dashboardで管理します。Miseがプロジェクトルートの`.env.local`を読み込み、`pnpm dev`がDocker依存サービスの起動、migration、検索初期化、Next.js起動を順番に実行します。型定義は`app/src/env.ts`を参照してください。初回セットアップ: `mise install` → `pnpm install` → `pnpm dev`。

## 詳細資料

- セットアップ: [docs/setup.md](docs/setup.md)
- テスト: [docs/testing.md](docs/testing.md)
- アーキテクチャ: [docs/architecture.md](docs/architecture.md)
- ドメインモデル: [docs/domain-model.md](docs/domain-model.md)
- セキュリティ: [SECURITY.md](SECURITY.md)
- VPSデプロイ: [docs/vps-deployment.md](docs/vps-deployment.md)
- コード分析: [docs/code-analysis.md](docs/code-analysis.md)
- スキーマ: [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)

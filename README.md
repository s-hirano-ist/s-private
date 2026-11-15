# s-private

![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)
![CI status](https://img.shields.io/github/actions/workflow/status/s-hirano-ist/s-private/ci.yaml?branch=main)
![GitHub stars](https://img.shields.io/github/stars/s-hirano-ist/s-private.svg)


> [!IMPORTANT]
> 仕事でできることは仕事でやる できないことをここで供養しよう

## Live Services

- **Documentation**: [docs.s-hirano.com](https://docs.s-hirano.com)
- **Storybook**: [storybook.s-hirano.com](https://storybook.s-hirano.com)
- **Application**: [private.s-hirano.com](https://private.s-hirano.com)

> [!IMPORTANT]
> This is a contents dump and search app made by s-hirano. Some codes are not best practices due to trying experimental features and new techs.

> [!NOTE]
> このプロジェクトでは、学習・検証を目的としてあえて幅広い技術スタックを採用しています。単一の最適解を追求するのではなく、様々な技術の実践的な知見を得ることを重視しています。

> [!NOTE]
> TerraformなどのInfrastructure as Code（IaC）は意図的に導入していません。各サービスの最新の設定項目をダッシュボードで確認し、実際に設定を試すことも、このリポジトリの学習・検証の目的に含まれるためです。

## iOS版

`apps/ios/` にはSwiftUI製のiOSアプリがあります。記事・ノート・画像・書籍の閲覧と登録、コンテンツの検索に対応しています。SwiftDataに保存したデータをオフラインで閲覧でき、再接続後の同期やShare Extensionからの登録にも対応しています。認証とデータの同期には独立した共通Hono backendの `/api/v1` を使用します。

開発環境の準備、Auth0の設定、実機での署名手順は [iOS開発ガイド](apps/ios/README.md) を参照してください。

## Technology Stack

### Core Framework
- **Framework** - [Next.js](https://nextjs.org/) with App Router
- **Language** - [TypeScript](https://www.typescriptlang.org/)
- **Package Manager** - [pnpm](https://pnpm.io/)
- **Runtime** - [React](https://react.dev/)
- **iOS** - SwiftUI + SwiftData（XcodeGenでXcodeプロジェクトを生成）

### UI & Styling
- **UI Components** - [Shadcn/ui](https://ui.shadcn.com/) with [Radix UI](https://www.radix-ui.com/)
- **Styling** - [Tailwind CSS](https://tailwindcss.com/)
- **Icons** - [Lucide React](https://lucide.dev/)
- **Theming** - [next-themes](https://github.com/pacocoursey/next-themes)

### Database & Storage
- **Database** - [CockroachDB](https://www.cockroachlabs.com/) (PostgreSQL-compatible, distributed) with [Prisma](https://www.prisma.io/) ORM
- **Object Storage** - [Backblaze B2](https://www.backblaze.com/cloud-storage) in Preview/Production; MinIO for local development (AWS SDK v3 / S3-compatible API)
### AI & Search
- **Embedding Model** - [intfloat/multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small) via Qdrant Cloud Inference in Preview/Production; [HuggingFace TEI](https://github.com/huggingface/text-embeddings-inference) in local Docker
- **Vector Database** - [Qdrant](https://qdrant.tech/)

### Authentication & Internationalization
- **Authentication** - [Auth0](https://auth0.com/) with [Better Auth](https://www.better-auth.com/)
- **Internationalization** - [next-intl](https://next-intl-docs.vercel.app/) (Japanese/English support)

### Code Quality & Development Tools
- **Formatter** - Vite+ (`vp fmt`) with [oxfmt](https://oxc.rs/docs/guide/usage/formatter) (Prettier-compatible; formatting + import & Tailwind class sorting)
- **Linters** - Vite+ (`vp lint`) with [oxlint](https://oxc.rs/docs/guide/usage/linter) for type-aware code linting + ESLint for YAML/JSON + Rust-native [rumdl](https://github.com/rvben/rumdl) for Markdown
- **Testing Framework** - [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/)
- **Component Development** - [Storybook](https://storybook.js.org/)

### Code Analysis & Quality Assurance
- **Dead Code Detection** - [Knip](https://knip.dev/)
- **Code Duplication Analysis** - [jscpd](https://github.com/kucherenko/jscpd)
- **Dependency Analysis** - [dependency-cruiser](https://github.com/sverweij/dependency-cruiser)
- **Bundle Analysis** - [`next experimental-analyze`](https://nextjs.org/docs) (built-in Next.js bundle analyzer)
- **Security Auditing** - [pnpm audit](https://pnpm.io/cli/audit)

### Documentation
- **API Documentation** - [TypeDoc](https://typedoc.org/) with packages strategy
- **Database Schema Visualization** - Dependency-free Node.js generator renders the Prisma schema as a Mermaid ER diagram and HTML page

### Dependency Management & Security
- **Automated Updates** - [Renovate](https://docs.renovatebot.com/)
  - Weekly scheduled updates (Mondays before 11am JST)
  - Automatic vulnerability alerts with `security` label
  - All dependency sources (npm, mise, Node.js, Docker Compose, GitHub Actions), including major updates, share one manually reviewed PR
  - Vulnerability fixes update that PR outside the weekly window
  - Periodic lockfile maintenance disabled
- **Manual Security Audits** - `pnpm audit` (moderate+ severity threshold)
- **Supply Chain Protection**
  - Package version pinning (`savePrefix: ''` in pnpm-workspace.yaml)
  - Shared dependency versions through the pnpm workspace catalog
  - Strict 24-hour minimum release age and trust-downgrade checks for recent releases
  - Lifecycle script protection (`allowBuilds` + `strictDepBuilds: true`)
  - Exotic subdep blocking (`blockExoticSubdeps: true`)
  - Frozen lockfiles in CI/CD

### Monitoring & Observability
- **Error Tracking** - [Sentry](https://sentry.io/)
- **Analytics** - [Vercel Analytics](https://vercel.com/analytics) & [Speed Insights](https://vercel.com/docs/speed-insights)
- **Logging** - [Pino](https://getpino.io/)
- **Notifications** - [Pushover](https://pushover.net/) integration

### Validation & Environment
- **Schema Validation** - [Zod](https://zod.dev/)
- **Environment Variables** - [@t3-oss/env-nextjs](https://env.t3.gg/)

## 初期設定

```bash
git clone https://github.com/s-hirano-ist/s-private.git
cd s-private
```

## Continuous Deployment

GitHubにブランチが作成されるとVercel cloudに自動的にPreview環境が構築される。

GitHubのmainブランチにPRがpullされるとProduction環境が更新される。

## Architecture Overview

### Clean Architecture with Domain-Driven Design

This project follows clean architecture principles with domain-driven design, ensuring separation of concerns and maintainable code structure.

#### Directory Structure

```text
├── packages/
│   ├── core/              # Domain entities, values, repository contracts
│   ├── application/       # Shared use cases, inputs/outputs, ports
│   ├── infrastructure/    # Prisma, storage, search, delivery adapters
│   ├── api-contracts/     # Hono + Zod HTTP contracts
│   ├── api-client/        # Generated client and transport
│   ├── database/          # Prisma schema, migrations, generated client
│   ├── image-processing/  # Shared image processing
│   ├── ui/                # Framework-agnostic React design system
│   ├── notification/      # Pushover client
│   ├── storage/           # S3-compatible storage client
│   ├── search/            # Qdrant and embedding clients
│   └── scripts/           # Published data-operation CLI and CLI composition
└── apps/
    ├── backend/           # Hono HTTP host, auth protocols, environment, DI, Cron
    ├── ios/               # SwiftUI, SwiftData, Share Extension
    └── web/src/           # Next.js SSR and BFF
        ├── application-services/ # Server Action API adapters
        ├── infrastructures/      # Browser auth, i18n, security, observability
        ├── common/backend/       # Request-scoped client and upstream forwarding
        ├── loaders/              # Data loading through the generated client
        ├── components/           # Application UI
        └── app/[locale]/         # Internationalized routes (en/ja)
```

#### Domain Boundaries

Each domain is completely isolated with its own:
- **Entities** - Core business logic and domain entities
- **Repositories** - Interface definitions (dependency inversion principle)
- **Services** - Complex business logic and domain operations
- **Types** - Domain-specific types and constants

#### Next.js App Router Features

- **Internationalization**: All routes support `[locale]` pattern for English/Japanese
- **Route Groups**: `(authenticated)` route group for owner-only content management pages
- **Server Actions**: All mutations use Next.js server actions with error boundary wrapping

### RAG & Search Architecture

```text
Web / iOS → 共通Hono backend → packages/search → Qdrant Cloud
                                               ├─ Cloud Inference（embedding）
                                               └─ collection（ベクトル保存・検索）
```

#### Data Flow

- **Ingestion**: コンテンツ → Qdrant Cloud Inferenceでベクトル化 → collectionに保存
- **Search**: 検索クエリ → Qdrant Cloud Inference → 類似検索 → 結果返却
- **Local**: DockerのQdrantとHugging Face TEIを使用。`LOCAL_DEV_MODE=true` の明示時だけローカルTEIへ接続する。

#### Key Components

- **`packages/search/`** - Qdrantクライアント、ローカルTEIクライアント、検索ロジック
- **Qdrant Cloud Inference** - Preview/Productionのembedding実行。ConoHa・Cloudflare Tunnelは使用しない。

### Database Architecture

Content management system with clean domain separation:

#### Core Models
- **Article** - News/link management with OpenGraph metadata and category association
- **Note** - Markdown-based content creation and management  
- **Image** - File metadata tracking with tags, dimensions, and S3 object path storage
- **Book** - ISBN-based book tracking with Google Books API integration and ratings

#### Supporting Models
- **Category** - Hierarchical organization for Article items

#### Common Patterns
- **Status Lifecycle**: `UNEXPORTED` → `LAST_UPDATED` → `EXPORTED` (all content types)
- **String-based IDs**: All models use String primary keys with UUIDs
- **User Isolation**: Every model includes `userId` for multi-tenant data separation
- **Unique Constraints**: Comprehensive per-user unique constraints

Schema location: `packages/database/prisma/schema.prisma`

### Key Architectural Patterns

- **Server Actions**: All mutations wrapped with `wrapServerSideErrorForClient`
- **Authorization**: 共通backendがBetter Auth CookieまたはAuth0 Bearerを検証し、所有者・tenantを確定する。WebのServer Actionは生成clientを呼ぶ。詳細は [認証・所有者検証](docs/architecture.md#authorization-pattern) を参照。
- **Error Handling**: Custom error classes with Sentry monitoring and critical-only Pushover notifications
- **Input Validation**: Zod schemas for all form and API input validation
- **Type Safety**: End-to-end TypeScript with runtime validation

### External Service Integrations

- **Authentication**: Better Auth + Auth0（Preview/Production）、固定開発ユーザー（local）
- **File Storage**: Backblaze B2 in Preview/Production, MinIO locally, through the S3-compatible API
- **Monitoring**: Sentry as the error-tracking source of truth; Pushover for critical and batch notifications
- **APIs**: Google Books API for ISBN-based book metadata enrichment
- **Vector Database**: Qdrant for semantic vector search

## Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) — version pinned in [.nvmrc](.nvmrc), installed via [Mise](https://mise.jdx.dev/)
- [pnpm](https://pnpm.io/) — version pinned in [.mise.toml](.mise.toml)
- [Docker](https://www.docker.com/) — local CockroachDB、MinIO、Qdrant、TEIで使用

### Initial Setup

```bash
git clone https://github.com/s-hirano-ist/s-private.git
cd s-private
mise install          # Node.js、pnpm等をインストール
pnpm install
```

### iOS開発

iOS版のビルドにはApple silicon Mac、macOS 27以降、Xcode 27、iOS 27 Simulator runtimeが必要です。Xcodeの準備後、次のコマンドでプロジェクトを生成し、ビルド・テストできます。

```bash
mise run ios:generate
mise run ios:build
mise run ios:test
```

実機での実行や認証・API接続の設定は [iOS開発ガイド](apps/ios/README.md) を参照してください。

### Environment Configuration

ローカル用の非機密設定はコミット済みの `.env.local`、Preview/Productionの秘密値は [Vercel Dashboard](https://vercel.com/) で管理します。`pnpm dev` はDockerサービス、migration、ローカルMinIO bucket、Qdrant collectionを初期化してから共通backendとNext.jsを起動します。

型定義とバリデーション: [`apps/web/src/env.ts`](apps/web/src/env.ts) と [`apps/backend/src/env.ts`](apps/backend/src/env.ts)。Doppler MCPは環境変数管理、agent-browserは動作確認に使用します。接続手順は [開発用MCP](docs/development-mcp.md) を参照。

> 環境変数の全体的な管理戦略（ローカル・CI・本番）については[環境変数管理](#環境変数管理)を参照。

### Database Setup

ローカル開発はDocker上のCockroachDBを使用します。Preview/ProductionのみCockroachDB Cloudへ接続します。マイグレーション運用の詳細は [docs/setup.md](docs/setup.md) を参照してください。

```bash
# (Optional) Open Prisma Studio for local database inspection
pnpm prisma:studio
```

### Development Workflow

```bash
# Start development server
pnpm dev

# Run development server with Next.js (http://localhost:3000)
# Hot reload enabled for all file changes
```

## Development Commands

### Essential Commands
```bash
# Development
pnpm dev                    # Prepare Docker services and start backend + Next.js
pnpm build                  # Build production application
pnpm --filter s-private-app start # Start the built Web app (BACKEND_URL required)

# Code Quality
pnpm format                # Format + import/Tailwind class sorting (Vite+ / oxfmt)
pnpm format:check          # Check formatting without writing (Vite+ / oxfmt)
pnpm lint                  # Lint code and structured config (Vite+ / oxlint + ESLint)
pnpm lint:fix              # Lint with auto-fixing (Vite+ / oxlint + ESLint)
pnpm lint:md               # Lint Markdown (rumdl)
pnpm lint:secret           # Scan secrets (Gitleaks)
pnpm deps:check            # Clean Architecture boundary check (dependency-cruiser)

# Testing
pnpm test                  # Run Vitest unit tests (storybook含む全プロジェクト)
pnpm typecheck             # TypeScript type checking (全パッケージ)

# Component Development
pnpm storybook             # Start Storybook (http://localhost:6006)
pnpm storybook:build       # Build static Storybook
pnpm storybook:agent       # Start non-interactive Storybook on an available port
pnpm ui-gallery:build      # Build Storybook, API docs, and the embedded UI gallery
```

### Code Quality & Analysis Tools

```bash
# Dead Code Detection
pnpm knip                  # Find unused files, dependencies, and exports

# Code Duplication Analysis
pnpm jscpd                 # Detect code duplication patterns

# Dependency Analysis
pnpm deps:check            # Validate architectural boundaries and detect issues
pnpm deps:graph            # Generate dependency-graph.md (Mermaid)
pnpm deps:circular         # Find circular dependencies

# Bundle Analysis
pnpm --filter s-private-app analyze  # Analyze Next.js bundle size (next experimental-analyze; app workspace only)

# Security & Licenses
pnpm security              # Check for security vulnerabilities (moderate+)
pnpm security:fix          # Auto-fix security vulnerabilities
pnpm security:report       # Generate JSON security audit report
pnpm license:summary       # Generate library license summary
pnpm license:check         # Check for forbidden licenses (GPL, LGPL variants)

# Note: Automated security updates are handled by Renovate (weekly schedule)
# Renovate configuration: .github/renovate.json5
```

> 各ツールの設定詳細・CI連携については [docs/code-analysis.md](docs/code-analysis.md) を参照。

### Database Operations

```bash
# Prisma Commands (Prisma client は pnpm install 時に postinstall で自動生成)
pnpm --filter @s-hirano-ist/s-database prisma:migrate:diff # Generate SQL against migration history (shadow DB required)
pnpm prisma:deploy         # Deploy migrations (cloud dev-db / production)
pnpm prisma:studio         # Open Prisma Studio database browser
```

### Documentation

```bash
# API Documentation (TypeDoc)
pnpm docs:build            # Generate API docs (TypeDoc + DB schema)
pnpm pages:build           # Generate GitHub Pages output (API docs + UI gallery)
pnpm docs:serve            # Serve generated docs locally
pnpm docs:watch            # Watch mode for TypeDoc
pnpm docs:clean            # Remove generated documentation

# Output: docs/api/ (gitignored)
# Pages output: .pages/ (gitignored)
# Live: https://docs.s-hirano.com
```

#### Documentation Configuration

- Root `typedoc.json` uses packages strategy (`packages/core`, `packages/ui`, `packages/notification`)
- Each package has its own `typedoc.json` for granular control
- `packages/database/scripts/generate-db-docs.mjs` parses `schema.prisma` and deterministically renders Mermaid Markdown and HTML without a generator plugin
- `docs:build` generates all documentation at once (TypeDoc + DB schema HTML)
- `pages:build` publishes API docs at `/api/` and a Figma-style embedded Storybook gallery at `/ui/`

## Testing Strategy

### Unit Testing (Vitest)
- Test files: `*.test.ts`, `*.test.tsx`
- Testing Library for React component testing
- Comprehensive coverage for domain logic and components

### Component Testing (Storybook)
- Component documentation and testing
- Accessibility testing with `@storybook/addon-a11y`
- Coverage reporting for component interactions

## Deployment & CI/CD

### Continuous Deployment
- **Preview Environments**: Automatic deployment to Vercel for all branches
- **Production**: Auto-deployment to Vercel when PRs are merged to `main`

### Environments
- **Development**: Docker（CockroachDB、MinIO、Qdrant、TEI）
- **Preview**: Vercel branch deployments
- **Production**: Vercel production deployment
- **Storybook**: Built into the GitHub Pages UI gallery; see [setup](docs/setup.md#static-documentation-and-ui-gallery)
- **Embedding**: Qdrant Cloud Inference（Preview/Production）、TEI（local）

### 環境変数管理

ローカル環境変数はコミット済みの `.env.local`、Preview/ProductionはVercel Dashboardで管理する。`.env.local`の値はローカル専用であり、外部環境では使用しない。

| 環境 | 管理方法 | 注入方法 |
|---|---|---|
| **ローカル開発** | `.env.local` | Miseまたは`pnpm dev`の`--env-file`で注入 |
| **Preview** | Vercel Dashboard | ビルド・ランタイムに自動注入 |
| **CI (GitHub Actions)** | ワークフロー内の固定ローカル値 | build/test は外部サービスへ接続しない |
| **本番 (Vercel)** | Vercel Dashboard | ビルド・ランタイムに自動注入 |

#### ローカル開発

1. `mise install` と `pnpm install` を実行
2. Dockerを起動
3. `pnpm dev`を実行
4. 終了後にコンテナも停止する場合は`pnpm local:down`を実行（volumeは保持）

#### CI (GitHub Actions)

CI の build/test はワークフロー内の localhost 向け固定値を使い、アプリ環境変数の GitHub Secrets は不要です。migration・自動更新には次の GitHub 設定を使用します:

- Secret: `PRODUCTION_DIRECT_URL` — 本番 Prisma migration 適用用（`.github/workflows/prisma-deploy.yaml`）
- Secret: `RENOVATE_APP_PRIVATE_KEY` — Renovate、release-please、月次レポート PR に使う GitHub App 秘密鍵
- Actions Variable: `RENOVATE_CLIENT_ID` — 上記 GitHub App の Client ID

任意のSonarQube Cloud連携のSecrets・Variablesは [コード分析](docs/code-analysis.md) を参照。

npm 公開は OIDC trusted publishing を使用し、外部利用のある `@s-hirano-ist/s-ui` と `@s-hirano-ist/s-scripts` に限定します。この2 packageで、repository を `s-hirano-ist/s-private`、workflow を `.github/workflows/release-please.yaml` として trusted publisher を設定してください。`NPM_TOKEN` は不要です。CLIは必要な内部workspaceを同梱します。既存バージョンのunpublishは行いません。

環境変数が不要なジョブ（lint, storybook）では `SKIP_ENV_VALIDATION: "true"` を設定。

#### 型定義・バリデーション

Webは [`apps/web/src/env.ts`](apps/web/src/env.ts)、backendは [`apps/backend/src/env.ts`](apps/backend/src/env.ts) で各環境の変数を検証する。`SKIP_ENV_VALIDATION` を設定するとバリデーションをスキップできる。

## Code Standards & Architecture Rules

### Formatting & Linting
- **Formatting**: Vite+ (`vp fmt`) with oxfmt for formatting, import organization, and Tailwind class sorting
- **Linting**: Vite+ (`vp lint`) with oxlint (type-aware) for TypeScript/JavaScript; ESLint for YAML/JSON; rumdl for Markdown; Gitleaks for secrets
- **Strict TypeScript**: Full type safety with runtime validation

### Architectural Constraints
- **No relative imports**: Use absolute imports instead of `../../*` patterns
- **Domain isolation**: Cross-domain imports are forbidden
- **Clean boundaries**: Each layer (domain, application, infrastructure) is isolated
- **Package manager**: pnpm required (enforced by `packageManager` field)

### 旧本番環境（現在はVercelに移行）

[s-tools/s-private](https://github.com/s-hirano-ist/s-tools/tree/main/s-private)を参照。

### 旧Storybook（現在はGitHub PagesのUI Galleryで公開）

[s-tools/s-storybook](https://github.com/s-hirano-ist/s-tools/tree/main/s-private)を参照。

## 📜 License

Licensed under the AGPL-3.0 License, Copyright © 2024

### Licenses of used libraries

See [library-license.txt](https://github.com/s-hirano-ist/s-private/blob/main/library-license.txt) for the summary of licenses used in this project.

**Automatic Updates**: This file is automatically updated monthly via [GitHub Actions](.github/workflows/update-reports.yaml).

To generate the license summary locally:
```bash
pnpm license:summary
```

### Code Duplication Report

See [jscpd-summary.txt](https://github.com/s-hirano-ist/s-private/blob/main/jscpd-summary.txt) for the latest code duplication analysis on the main branch.

**Automatic Updates**: This file is automatically updated monthly via [GitHub Actions](.github/workflows/update-reports.yaml).

To run code duplication analysis locally:
```bash
pnpm jscpd
```

開発エージェントの接続設定は [開発用MCP設定](docs/development-mcp.md) を参照してください。

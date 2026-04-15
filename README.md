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

## Technology Stack

### Core Framework
- **Framework** - [Next.js](https://nextjs.org/) with App Router
- **Language** - [TypeScript](https://www.typescriptlang.org/)
- **Package Manager** - [pnpm](https://pnpm.io/)
- **Runtime** - [React](https://react.dev/)

### UI & Styling
- **UI Components** - [Shadcn/ui](https://ui.shadcn.com/) with [Radix UI](https://www.radix-ui.com/)
- **Styling** - [Tailwind CSS](https://tailwindcss.com/)
- **Icons** - [Lucide React](https://lucide.dev/) & [Radix Icons](https://icons.radix-ui.com/)
- **Theming** - [next-themes](https://github.com/pacocoursey/next-themes)

### Database & Storage
- **Database** - [PostgreSQL](https://www.postgresql.org/) with [Prisma](https://www.prisma.io/) ORM
- **Object Storage** - [MinIO](https://min.io/) (configurable for local/cloud deployment)
### AI & Search
- **Embedding Model** - [intfloat/multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small) via [HuggingFace TEI](https://github.com/huggingface/text-embeddings-inference) (Docker)
- **Vector Database** - [Qdrant](https://qdrant.tech/)
- **Tunnel** - [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) (Zero Trust)

### Authentication & Internationalization
- **Authentication** - [Auth0](https://auth0.com/) with [NextAuth.js](https://next-auth.js.org/)
- **Internationalization** - [next-intl](https://next-intl-docs.vercel.app/) (Japanese/English support)

### Code Quality & Development Tools
- **Primary Formatter/Linter** - [Biome](https://biomejs.dev/)
- **Secondary Linter** - [ESLint](https://eslint.org/) for React/Next.js specific rules
- **Testing Framework** - [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/)
- **Component Development** - [Storybook](https://storybook.js.org/)

### Code Analysis & Quality Assurance
- **Dead Code Detection** - [Knip](https://knip.dev/)
- **Code Duplication Analysis** - [jscpd](https://github.com/kucherenko/jscpd)
- **Dependency Analysis** - [dependency-cruiser](https://github.com/sverweij/dependency-cruiser)
- **Bundle Analysis** - [@next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- **Security Auditing** - [pnpm audit](https://pnpm.io/cli/audit)

### Documentation
- **API Documentation** - [TypeDoc](https://typedoc.org/) with packages strategy
- **Database Schema Visualization** - [DBML](https://dbml.dbdiagram.io/) with [prisma-dbml-generator](https://github.com/notiz-dev/prisma-dbml-generator)

### Dependency Management & Security
- **Automated Updates** - [Renovate](https://docs.renovatebot.com/)
  - Weekly scheduled updates (Mondays before 11am JST)
  - Automatic vulnerability alerts with `security` label
  - Minimum release age: 3 days for patches/minors, preventing supply chain attacks
  - Grouped updates: patches, minors, and GitHub Actions
  - Lock file maintenance enabled
- **Manual Security Audits** - `pnpm audit` (moderate+ severity threshold)
- **Supply Chain Protection**
  - Package version pinning (`save-exact=true`)
  - Lifecycle script protection (`ignore-dep-scripts=true`)
  - Minimum release age: 24 hours (pnpm-workspace.yaml)
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

```
├── packages/                       # Monorepo packages
│   ├── core/                       # Domain Layer (Core Business Logic)
│   │   ├── articles/               # News/link management domain
│   │   ├── notes/                  # Markdown content domain
│   │   ├── images/                 # File metadata domain
│   │   ├── books/                  # ISBN-based book tracking domain
│   │   └── shared-kernel/          # Cross-domain shared logic
│   │
│   ├── database/                   # Database Layer
│   │   └── prisma/                 # Prisma ORM & migrations
│   │
│   ├── ui/                         # Shared UI Components
│   │   ├── ui/                     # shadcn/ui base components
│   │   ├── display/                # Display components (status, etc.)
│   │   ├── forms/                  # Form components & fields
│   │   ├── layouts/                # Layout components (body, etc.)
│   │   ├── hooks/                  # Shared React hooks
│   │   ├── providers/              # Context providers
│   │   └── utils/                  # UI utilities
│   │
│   ├── notification/               # Notification services
│   │
│   ├── storage/                    # MinIO Storage Client
│   │   └── src/                    # MinIO client implementation
│   │
│   ├── search/                     # RAG Search Library
│   │   └── src/                    # Qdrant client, Embedding API client
│   │
│   └── scripts/                    # Build & utility scripts
│       └── src/
│           ├── infrastructures/
│           └── rag/
│
└── app/src/                        # Next.js Application
    ├── application-services/       # Application Layer (Use Cases)
    │   ├── articles/
    │   ├── notes/
    │   ├── images/
    │   ├── books/
    │   ├── search/                 # Search functionality
    │   └── common/                 # Shared application utilities
    │
    ├── infrastructures/            # Infrastructure Layer (External Concerns)
    │   ├── articles/               # Article repository implementation
    │   ├── notes/                  # Note repository implementation
    │   ├── images/                 # Image repository implementation
    │   ├── books/                  # Book repository implementation
    │   ├── auth/                   # Auth0 + NextAuth.js integration
    │   ├── i18n/                   # next-intl configuration
    │   ├── observability/          # Sentry, logging, monitoring
    │   ├── events/                 # Event handling
    │   ├── factories/              # Dependency injection factories
    │   ├── search/                 # Search infrastructure
    │   └── shared/                 # Shared infrastructure utilities
    │
    ├── loaders/                    # Data loading layer
    │   ├── articles/
    │   ├── notes/
    │   ├── images/
    │   └── books/
    │
    ├── common/                     # Shared utilities
    │   ├── auth/
    │   ├── error/
    │   └── utils/
    │
    ├── components/                 # UI Components (Interface Layer)
    │   ├── articles/
    │   ├── notes/
    │   ├── images/
    │   ├── books/
    │   └── common/
    │
    └── app/                        # Next.js App Router
        └── [locale]/               # Internationalized routes (en/ja)
            ├── (dumper)/           # Dumper role pages
            │   ├── articles/       # Articles management page
            │   ├── books/          # Books management page
            │   ├── images/         # Images management page
            │   └── notes/          # Notes management page
            ├── book/[slug]/        # Book detail page
            ├── note/[slug]/        # Note detail page
            └── error/              # Error page
```

#### Domain Boundaries

Each domain is completely isolated with its own:
- **Entities** - Core business logic and domain entities
- **Repositories** - Interface definitions (dependency inversion principle)
- **Services** - Complex business logic and domain operations
- **Types** - Domain-specific types and constants

#### Next.js App Router Features

- **Internationalization**: All routes support `[locale]` pattern for English/Japanese
- **Route Groups**: `(dumper)` route group for content management pages
- **Server Actions**: All mutations use Next.js server actions with error boundary wrapping

### RAG & Search Architecture

```
┌──────────────┐     ┌─────────────────────────────────────────┐
│  Next.js App │     │  ConoHa VPS (Docker)                    │
│  (Vercel)    │     │                                         │
│              │ CF  │  ┌───────────────┐                      │
│  packages/   │────▶│  │ HuggingFace   │  Cloudflare Tunnel   │
│  search/     │Tunnel│  │ TEI (:3001)   │◀── cloudflared       │
│              │     │  └───────────────┘                      │
└──────┬───────┘     │  multilingual-e5-small                  │
       │             └─────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   Qdrant     │
│ (Vector DB)  │
└──────────────┘
```

#### Data Flow

- **Ingestion**: コンテンツ → Embedding API → ベクトル化 → Qdrant に保存
- **Search**: 検索クエリ → Embedding API → クエリベクトル化 → Qdrant で類似検索 → 結果返却

#### Key Components

- **`packages/search/`** - RAG 検索ライブラリ（Qdrant クライアント、Embedding API クライアント、検索ロジック）
- **HuggingFace TEI** - Embedding API サービス（`compose.yaml` で定義、ConoHa VPS にデプロイ）

### Database Architecture

Content management system with clean domain separation:

#### Core Models
- **Article** - News/link management with OpenGraph metadata and category association
- **Note** - Markdown-based content creation and management  
- **Image** - File metadata tracking with tags, dimensions, and MinIO path storage
- **Book** - ISBN-based book tracking with Google Books API integration and ratings

#### Supporting Models
- **Category** - Hierarchical organization for Article items
- **User** - Multi-tenant user isolation across all content types

#### Common Patterns
- **Status Lifecycle**: `UNEXPORTED` → `LAST_UPDATED` → `EXPORTED` (all content types)
- **String-based IDs**: All models use String primary keys with UUIDs
- **User Isolation**: Every model includes `userId` for multi-tenant data separation
- **Unique Constraints**: Comprehensive per-user unique constraints

Schema location: `packages/database/prisma/schema.prisma`

### Key Architectural Patterns

- **Server Actions**: All mutations wrapped with `wrapServerSideErrorForClient`
- **Role-based Authorization**: `viewer`/`dumper` roles via Auth0 + NextAuth.js
- **Error Handling**: Custom error classes with Pushover notifications and Sentry monitoring
- **Input Validation**: Zod schemas for all form and API input validation
- **Type Safety**: End-to-end TypeScript with runtime validation

### External Service Integrations

- **Authentication**: Auth0 with NextAuth.js for session management
- **File Storage**: MinIO for object storage (configurable for local/cloud)
- **Monitoring**: Sentry for error tracking, Pushover for notifications
- **APIs**: Google Books API for ISBN-based book metadata enrichment
- **VPS Services**: ConoHa VPS (Docker) + Cloudflare Tunnel ([deployment guide](docs/vps-deployment.md))
- **Vector Database**: Qdrant for semantic vector search

## Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v24.14.1 (managed via [Mise](https://mise.jdx.dev/))
- [pnpm](https://pnpm.io/) v10.33.0 (managed via Mise)
- [Doppler CLI](https://docs.doppler.com/docs/install-cli) v3.75.3 (managed via Mise)
- [Docker](https://www.docker.com/) (for PostgreSQL database)

### Initial Setup

```bash
git clone https://github.com/s-hirano-ist/s-private.git
cd s-private
mise install          # Node.js, pnpm, Doppler CLI 等をインストール
pnpm install
```

### Environment Configuration

環境変数は **dev/preview 環境は [Doppler](https://www.doppler.com/)**、**本番環境は [Vercel Dashboard](https://vercel.com)** で管理します。

> Vercel CLI に一本化しない理由: `vercel env run` は dev 環境から本番環境の変数にもアクセスできてしまうため、セキュリティ上 dev/preview は Doppler で分離しています。

```bash
# .env.local にDopplerサービストークンを設定（Doppler Dashboard から発行）
echo "DOPPLER_TOKEN=dp.st.dev.xxxxxxxxxxxx" > .env.local

vercel link          # 初回のみ: Vercel プロジェクトをリンク（prisma/docker 用）
```

Mise が `.env.local` を自動読み込みし、`doppler run` が `DOPPLER_TOKEN` を検出して環境変数を取得します。`doppler login` / `doppler setup` は不要です。

`pnpm dev` / `pnpm build` / `pnpm start` 等の app スクリプトは `doppler run` 経由で環境変数を取得します。`pnpm prisma:*` / `pnpm docker:up` 等のルートスクリプトは `vercel env run -e development` を使用します。

型定義とバリデーション: [`app/src/env.ts`](app/src/env.ts)（`@t3-oss/env-nextjs` + Zod）

> 環境変数の全体的な管理戦略（ローカル・CI・本番・VPS）については[環境変数管理](#環境変数管理)を参照。

### Database Setup

Start PostgreSQL database and run migrations:

```bash
# Start PostgreSQL with Docker
docker compose up --build -d

# Run database migrations (Prisma client は pnpm install 時に自動生成)
pnpm prisma:migrate

# (Optional) Open Prisma Studio for database inspection
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
pnpm dev                    # Start Next.js development server
pnpm build                  # Build production application
pnpm start                  # Start production server

# Code Quality
pnpm check:fix             # Primary formatting and linting (Biome)
pnpm lint                  # ESLint checking
pnpm lint:fix              # ESLint with auto-fixing
pnpm lint:inspector        # ESLint configuration inspector

# Testing
pnpm test                  # Run Vitest unit tests (storybook含む全プロジェクト)
pnpm typecheck             # TypeScript type checking (全パッケージ)

# Component Development
pnpm storybook             # Start Storybook (http://localhost:6006)
pnpm storybook:build       # Build static Storybook
```

### Code Quality & Analysis Tools

```bash
# Dead Code Detection
pnpm knip                  # Find unused files, dependencies, and exports

# Code Duplication Analysis
pnpm jscpd                 # Detect code duplication patterns

# Dependency Analysis
pnpm deps:check            # Validate architectural boundaries and detect issues
pnpm deps:graph            # Generate visual dependency graph (SVG)
pnpm deps:circular         # Find circular dependencies

# Bundle Analysis
pnpm analyze               # Analyze Next.js bundle size with webpack-bundle-analyzer

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
pnpm prisma:migrate        # Create and apply new migrations
pnpm prisma:deploy         # Deploy migrations (production)
pnpm prisma:studio         # Open Prisma Studio database browser
```

### Documentation

```bash
# API Documentation (TypeDoc)
pnpm docs:build            # Generate API docs (TypeDoc + DB schema)
pnpm docs:serve            # Serve generated docs locally
pnpm docs:watch            # Watch mode for TypeDoc
pnpm docs:clean            # Remove generated documentation

# Output: docs/api/ (gitignored)
# Live: https://docs.s-hirano.com
```

#### Documentation Configuration

- Root `typedoc.json` uses packages strategy (`packages/core`, `packages/ui`, `packages/notification`)
- Each package has its own `typedoc.json` for granular control
- `prisma-dbml-generator` auto-generates DBML from Prisma schema → `dbml-renderer` converts to SVG
- `docs:build` generates all documentation at once (TypeDoc + DB schema HTML)

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
- **Development**: Local with Docker Compose
- **Preview**: Vercel branch deployments
- **Production**: Vercel production deployment
- **Storybook**: Deployed to Cloudflare Pages
- **Embedding API**: ConoHa VPS (Docker) + Cloudflare Tunnel

### 環境変数管理

環境変数は dev/preview 環境は Doppler、本番環境は Vercel Dashboard で管理する。Vercel CLI に一本化しない理由は、`vercel env run` が dev 環境から本番環境の変数にもアクセスできてしまうため。

| 環境 | 管理方法 | 注入方法 |
|---|---|---|
| **ローカル開発（app）** | Doppler | `doppler run -- <command>`（app/package.json スクリプトに組み込み済み） |
| **ローカル開発（prisma/docker）** | Vercel Dashboard (dev) | `vercel env run -e development -- <command>`（root package.json スクリプトに組み込み済み） |
| **CI (GitHub Actions)** | GitHub Secrets | ワークフローの `env:` で `${{ secrets.XXX }}` として注入 |
| **本番 (Vercel)** | Vercel Dashboard | ビルド・ランタイムに自動注入 |
| **VPS (Docker Compose)** | `~/s-private/.env` | Docker Compose が `.env` を自動読み込み |

#### ローカル開発

1. `mise install` でツール一式をインストール（Node.js, pnpm, Doppler CLI 等）
2. `.env.local` に Doppler サービストークンを設定（[Doppler Dashboard](https://dashboard.doppler.com/) > dev 環境 > Access > Service Tokens から発行）
3. `vercel link` で Vercel プロジェクトをリンク（初回のみ、prisma/docker 用）
4. `pnpm dev` / `pnpm build` / `pnpm start` 等の app スクリプトは Doppler から環境変数を取得
5. `pnpm prisma:*` / `pnpm docker:up` 等のルートスクリプトは Vercel dev 環境から環境変数を取得

#### CI (GitHub Actions)

必要な GitHub Secrets:
- アプリ環境変数: `DATABASE_URL`, `AUTH_SECRET`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_ISSUER_BASE_URL`, `SENTRY_AUTH_TOKEN`, `SENTRY_REPORT_URL`, `MINIO_HOST`, `MINIO_BUCKET_NAME`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `PUSHOVER_USER_KEY`, `PUSHOVER_APP_TOKEN`, `EMBEDDING_API_URL`, `QDRANT_URL`, `QDRANT_COLLECTION_NAME`, `NEXT_PUBLIC_SENTRY_DSN`
- 本番 DB: `PRODUCTION_DATABASE_URL` — Prisma マイグレーションデプロイ用
- `NPM_TOKEN` — パッケージ公開（release-please のみ）
- `ACTIONS_GITHUB_TOKEN` — リリース PR 作成

環境変数が不要なジョブ（eslint, storybook）では `SKIP_ENV_VALIDATION: "true"` を設定。

#### VPS (Docker Compose)

VPS 上の Docker Compose サービス用の環境変数は `~/s-private/.env` に配置する。詳細は [docs/vps-deployment.md Step 7](docs/vps-deployment.md) を参照。

#### 型定義・バリデーション

[`app/src/env.ts`](app/src/env.ts) で `@t3-oss/env-nextjs` + Zod を使用し、ビルド時に全変数をバリデーションする。`SKIP_ENV_VALIDATION` を設定するとバリデーションをスキップできる。

## Code Standards & Architecture Rules

### Formatting & Linting
- **Primary**: Biome for comprehensive formatting, linting, and import organization
- **Secondary**: ESLint for React/Next.js specific rules and accessibility checks
- **Strict TypeScript**: Full type safety with runtime validation

### Architectural Constraints
- **No relative imports**: Use absolute imports instead of `../../*` patterns
- **Domain isolation**: Cross-domain imports are forbidden
- **Clean boundaries**: Each layer (domain, application, infrastructure) is isolated
- **Package manager**: pnpm required (enforced by `packageManager` field)

### 旧本番環境（現在はVercelに移行）

[s-tools/s-private](https://github.com/s-hirano-ist/s-tools/tree/main/s-private)を参照。

### 旧Storybook（現在はCloudflare Pagesに移行）

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


# s-private

![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)
![CI/CD status](https://img.shields.io/github/actions/workflow/status/s-hirano-ist/s-private/cd.yaml?branch=main)
![GitHub stars](https://img.shields.io/github/stars/s-hirano-ist/s-private.svg)

## Live Services

- **Documentation**: [docs.s-hirano.com](https://docs.s-hirano.com)
- **Storybook**: [storybook.s-hirano.com](https://storybook.s-hirano.com)
- **Application**: [private.s-hirano.com](https://private.s-hirano.com)

> [!IMPORTANT]
> This is a contents dump and search app made by s-hirano. Some codes are not best practices due to trying experimental features and new techs.

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
- **Database Acceleration** - [Prisma Accelerate](https://www.prisma.io/accelerate)

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

## Docker Imageのビルドとプッシュ

MainブランチにPRがpushされたら自動的に[DockerHub](https://hub.docker.com/repository/docker/s0hirano/s-private/general)にイメージがpushされる仕組み。

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
│   │   ├── shared-kernel/          # Cross-domain shared logic
│   │   ├── errors/                 # Domain error definitions
│   │   └── common/                 # Shared domain utilities
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
    │   ├── transaction/            # Transaction management
    │   └── common/                 # Shared infrastructure utilities
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
            │   ├── @articles/      # Parallel route for articles
            │   ├── @books/         # Parallel route for books
            │   ├── @images/        # Parallel route for images
            │   └── @notes/         # Parallel route for notes
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
- **Parallel Routes**: Extensive use of `@name` parallel routes for complex multi-panel UIs
- **Role-based Routing**: Route group `(dumper)` for content management with parallel routes
- **Server Actions**: All mutations use Next.js server actions with error boundary wrapping

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
- **Status Lifecycle**: `UNEXPORTED` → `EXPORTED` (all content types)
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

## Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v22.20.0 (managed via [Volta](https://volta.sh/))
- [pnpm](https://pnpm.io/) v10.18.2 (managed via Volta)
- [Docker](https://www.docker.com/) (for PostgreSQL database)

### Initial Setup

```bash
git clone https://github.com/s-hirano-ist/s-private.git
cd s-private
pnpm install
```

### Environment Configuration

Create environment files based on the templates:
- Copy `app/.env.sample` to `app/.env.local` and configure required variables
- Set up Auth0 credentials, database URLs, and external service API keys

### Database Setup

Start PostgreSQL database and run migrations:

```bash
# Start PostgreSQL with Docker
docker compose up --build -d

# Generate Prisma client
pnpm prisma:generate

# Run database migrations
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
pnpm test                  # Run Vitest unit tests
pnpm test:typecheck        # TypeScript type checking tests
pnpm test:all              # Run all tests (unit + typecheck)
pnpm test:storybook        # Run Storybook test runner with coverage

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

### Database Operations

```bash
# Prisma Commands
pnpm prisma:generate       # Generate Prisma client
pnpm prisma:migrate        # Create and apply new migrations
pnpm prisma:deploy         # Deploy migrations (production)
pnpm prisma:studio         # Open Prisma Studio database browser
```

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
- **Docker Images**: Automatic build and push to [DockerHub](https://hub.docker.com/repository/docker/s0hirano/s-private/general) on main branch updates

### Environments
- **Development**: Local with Docker Compose
- **Preview**: Vercel branch deployments
- **Production**: Vercel production deployment
- **Storybook**: Deployed to Cloudflare Pages

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

## TODO

READMEに下記を記述。CIにより強制はしないけど、AIコードレビュー時に役立てる設計

1. knipによる不要ファイル確認
2. jscpdによるコード重複率確認
3. depcruiseによる依存ファイル確認

## Docker

```
docker build -f .storybook/storybook.Dockerfile -t storybook .
docker build -f app/Dockerfile -t app .
```

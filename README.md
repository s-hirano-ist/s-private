# s-private

![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)
![CI/CD status](https://img.shields.io/github/actions/workflow/status/s-hirano-ist/s-private/cd.yaml?branch=main)
![GitHub stars](https://img.shields.io/github/stars/s-hirano-ist/s-private.svg)

> [!IMPORTANT]
> This is a contents dump and search app made by s-hirano. Some codes are not best practices due to trying experimental features and new techs.

## Technology Stack

### Core Framework
- **Framework** - [Next.js](https://nextjs.org/) (v15.4.6) with App Router
- **Language** - [TypeScript](https://www.typescriptlang.org/) (v5.9.2)
- **Package Manager** - [pnpm](https://pnpm.io/) (v10.14.0)
- **Runtime** - [React](https://react.dev/) (v19.1.1)

### UI & Styling
- **UI Components** - [Shadcn/ui](https://ui.shadcn.com/) with [Radix UI](https://www.radix-ui.com/)
- **Styling** - [Tailwind CSS](https://tailwindcss.com/) (v4.1.12)
- **Icons** - [Lucide React](https://lucide.dev/) & [Radix Icons](https://icons.radix-ui.com/)
- **Theming** - [next-themes](https://github.com/pacocoursey/next-themes)

### Database & Storage
- **Database** - [PostgreSQL](https://www.postgresql.org/) with [Prisma](https://www.prisma.io/) ORM (v6.14.0)
- **Object Storage** - [MinIO](https://min.io/) (configurable for local/cloud deployment)
- **Database Acceleration** - [Prisma Accelerate](https://www.prisma.io/accelerate)

### Authentication & Internationalization
- **Authentication** - [Auth0](https://auth0.com/) with [NextAuth.js](https://next-auth.js.org/) (v5.0.0-beta.29)
- **Internationalization** - [next-intl](https://next-intl-docs.vercel.app/) (Japanese/English support)

### Code Quality & Development Tools
- **Primary Formatter/Linter** - [Biome](https://biomejs.dev/) (v2.2.0)
- **Secondary Linter** - [ESLint](https://eslint.org/) (v9.33.0) for React/Next.js specific rules
- **Testing Framework** - [Vitest](https://vitest.dev/) (v3.2.4) with [Testing Library](https://testing-library.com/)
- **E2E Testing** - [Playwright](https://playwright.dev/) (v1.54.2)
- **Component Development** - [Storybook](https://storybook.js.org/) (v9.1.2)

### Code Analysis & Quality Assurance
- **Dead Code Detection** - [Knip](https://knip.dev/) (v5.62.0)
- **Code Duplication Analysis** - [jscpd](https://github.com/kucherenko/jscpd) (v4.0.5)
- **Dependency Analysis** - [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) (v17.0.1)
- **Bundle Analysis** - [@next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- **Security Auditing** - [pnpm audit](https://pnpm.io/cli/audit) & [Dependabot](https://docs.github.com/en/code-security/dependabot)

### Monitoring & Observability
- **Error Tracking** - [Sentry](https://sentry.io/) (v10.5.0)
- **Analytics** - [Vercel Analytics](https://vercel.com/analytics) & [Speed Insights](https://vercel.com/docs/speed-insights)
- **Logging** - [Pino](https://getpino.io/) (v9.9.0)
- **Notifications** - [Pushover](https://pushover.net/) integration

### Validation & Environment
- **Schema Validation** - [Zod](https://zod.dev/) (v4.0.17)
- **Environment Variables** - [@t3-oss/env-nextjs](https://env.t3.gg/) (v0.13.8)

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
src/
├── domains/                    # Domain Layer (Core Business Logic)
│   ├── articles/              # News/link management domain
│   ├── notes/                 # Markdown content domain  
│   ├── images/                # File metadata domain
│   ├── books/                 # ISBN-based book tracking domain
│   ├── auth/                  # Authentication domain
│   └── common/                # Shared domain utilities
│
├── application-services/       # Application Layer (Use Cases)
│   ├── articles/              # Article-specific application services
│   ├── notes/                 # Note-specific application services
│   ├── images/                # Image-specific application services
│   └── books/                 # Book-specific application services
│
├── infrastructures/           # Infrastructure Layer (External Concerns)
│   ├── repositories/          # Prisma ORM implementations
│   ├── auth/                  # Auth0 + NextAuth.js integration
│   ├── i18n/                  # next-intl configuration
│   └── observability/         # Sentry, logging, monitoring
│
├── components/                # UI Components (Interface Layer)
│   ├── articles/              # Article-specific components
│   ├── notes/                 # Note-specific components
│   ├── images/                # Image-specific components
│   ├── books/                 # Book-specific components
│   └── ui/                    # Shared UI components (shadcn/ui)
│
└── app/                       # Next.js App Router
    └── [locale]/              # Internationalized routes (en/ja)
        ├── (dumper)/          # Dumper role pages
        │   ├── @notes/        # Parallel route for notes
        │   ├── @images/       # Parallel route for images
        │   ├── @articles/     # Parallel route for articles
        │   └── @dump/         # Parallel route for dump
        └── (viewer)/          # Viewer role pages
            ├── @books/        # Parallel route for books
            ├── @notes/        # Parallel route for notes
            ├── @images/       # Parallel route for images
            └── @articles/     # Parallel route for articles
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
- **Role-based Routing**: Separate route groups for `(dumper)` and `(viewer)` roles
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

Schema location: `s-schema/schema.prisma`

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
- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/) (v10.14.0)
- [Docker](https://www.docker.com/) (for PostgreSQL database)

### Initial Setup

```bash
git clone https://github.com/s-hirano-ist/s-private.git
cd s-private
pnpm install
```

### Environment Configuration

Create environment files based on the templates:
- Copy `.env.example` to `.env.local` and configure required variables
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
pnpm biome:fix             # Primary formatting and linting (Biome)
pnpm lint                  # ESLint checking
pnpm lint:fix              # ESLint with auto-fixing
pnpm lint:inspector        # ESLint configuration inspector

# Testing
pnpm test                  # Run Vitest unit tests
pnpm test:typecheck        # TypeScript type checking tests
pnpm test:all              # Run all tests (unit + typecheck)
pnpm test:e2e              # Run Playwright E2E tests
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
pnpm security             # Check for security vulnerabilities
pnpm license:summary       # Generate library license summary
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

### End-to-End Testing (Playwright)
- Configuration: `playwright.config.ts`
- Cross-browser testing for critical user flows
- Visual regression testing capabilities

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

See [library-license.txt](https://github.com/s-hirano-ist/s-private/blob/main/library-license.txt) for summary of used licenses.

## TODO

READMEに下記を記述。CIにより強制はしないけど、AIコードレビュー時に役立てる設計

1. knipによる不要ファイル確認
2. jscpdによるコード重複率確認
3. depcruiseによる依存ファイル確認

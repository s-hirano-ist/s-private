# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Before doing any UI, frontend or React development, ALWAYS call the storybook MCP server to get further instructions.

## Common Development Commands

### Essential Commands
- **Development**: `pnpm dev` - Start Next.js development server
- **Build**: `pnpm build` - Build the application
- **Lint**: `pnpm lint` or `pnpm lint:fix` - ESLint checking/fixing
- **Lint Inspector**: `pnpm lint:inspector` - ESLint configuration inspector
- **Biome**: `pnpm biome:fix` - Biome formatting and linting
- **Biome CI**: `pnpm biome:ci` - Biome CI checking (non-interactive)
- **Test**: `pnpm test` - Run all Vitest unit tests (workspace-wide)
- **Test App**: `pnpm test:app` - Run tests for app package only
- **Test UI**: `pnpm test:components` - Run tests for UI package only
- **Test Core**: `pnpm test:core` - Run tests for core package only
- **Test Watch**: `pnpm test:watch` - Run tests in watch mode
- **Test with Type Check**: `pnpm test:typecheck` - Run TypeScript type checking on test files only
- **Test All**: `pnpm test:all` - Run all unit tests and type checking
- **Storybook**: `pnpm storybook` - Unified Storybook for all components (app + packages/ui)
- **Storybook Build**: `pnpm storybook:build` - Build static Storybook

### Code Quality & Analysis
- **Check Dependencies**: `pnpm deps:check` - Analyze dependencies and detect issues
- **Generate Dependency Graph**: `pnpm deps:graph` - Create visual dependency graph (SVG)
- **Find Circular Dependencies**: `pnpm deps:circular` - Detect circular dependencies
- **Bundle Analysis**: `pnpm analyze` - Analyze Next.js bundle size
- **Dead Code Detection**: `pnpm knip` - Find unused files and dependencies
- **Copy-Paste Detection**: `pnpm jscpd` - Detect code duplication

### Security
- **Security Audit**: `pnpm security` - Check for vulnerabilities (fails on moderate+)
- **Security Fix**: `pnpm security:fix` - Auto-fix security vulnerabilities
- **Security Report**: `pnpm security:report` - Generate JSON security report
- **Documentation**: See [SECURITY.md](SECURITY.md) for complete security best practices

#### Automated Dependency Management (Renovate)
This project uses Renovate for automated dependency updates with security-first approach:
- **Schedule**: Weekly updates (Mondays before 11am JST)
- **Vulnerability Alerts**: Automatic PRs for security issues (labeled `security`)
- **Supply Chain Protection**: 3-day minimum release age for patches/minors (72 hours), 24-hour global minimum (pnpm-workspace.yaml)
- **Grouped Updates**: Patches, minors, and GitHub Actions are grouped separately
- **Configuration**: See [.github/renovate.json5](.github/renovate.json5)

#### npm/pnpm Security Settings
- **Version Pinning**: `save-exact=true` in .npmrc + `savePrefix: ''` in pnpm-workspace.yaml
- **Lifecycle Script Protection**: `ignore-dep-scripts=true` prevents malicious scripts from external dependencies
- **CI/CD**: `--frozen-lockfile` enforced in all CI workflows
- **Minimum Release Age**: 24-hour global setting in pnpm-workspace.yaml to avoid newly published malicious packages

### Database Operations
- **Generate Prisma**: `pnpm prisma:generate` - Generate Prisma client
- **Database Migration**: `pnpm prisma:migrate` - Apply schema changes
- **Database Studio**: `pnpm prisma:studio` - Visual database browser
- **Deploy Migration**: `pnpm prisma:deploy` - Production deployment

### Additional Tools
- **License Summary**: `pnpm license:summary` - Generate library license summary
- **License Check**: `pnpm license:check` - Check for forbidden licenses (GPL, LGPL variants) across all packages
- **Post Install**: `pnpm postinstall` - Auto-generate Prisma client after installation

### Development Setup
```bash
pnpm install
docker compose up --build -d  # Start PostgreSQL database
pnpm dev
```

### Volta Configuration

This project uses [Volta](https://volta.sh/) for Node.js and package manager version management. The versions are pinned in `package.json`:

- **Node.js**: 22.20.0
- **pnpm**: 10.18.2

**pnpm Support in Volta** (Experimental):
Volta's pnpm support is currently experimental. To enable it:

1. Set the environment variable (required):
   ```bash
   # macOS/Linux - Add to ~/.zshrc or ~/.bash_profile
   export VOLTA_FEATURE_PNPM=1

   # Windows - Add to System Environment Variables
   # VOLTA_FEATURE_PNPM=1
   ```

2. Install pnpm via Volta:
   ```bash
   # If you have existing pnpm installed via Volta
   volta uninstall pnpm

   # Reinstall pnpm with experimental support enabled
   volta install pnpm
   ```

**Limitations**:
- Global installations (`pnpm install -g`) are not supported
- This is an experimental feature and may have issues

**Note**: Once configured, Volta will automatically use the correct Node.js and pnpm versions specified in `package.json` when you enter the project directory.

## Architecture Overview

### Next.js App Router Structure
- **Internationalization**: Routes use `[locale]` pattern (en/ja support)
- **Parallel Routes**: Extensive use of `@name` parallel routes for complex UIs
  - Dumper section: `@articles`, `@notes`, `@images`, `@books`
  - Viewer section: `@articles`, `@notes`, `@images`, `@books`

### Clean Architecture Organization
The codebase follows clean architecture with domain-driven design:

**Domain Layer** (`src/domains/`):
- `entities/` - Core business logic and domain entities
- `repositories/` - Repository interfaces (dependency inversion)
- `services/` - Domain services for complex business logic
- `types/` - Domain-specific types and constants

**Application Services Layer** (`src/application-services/`):
- Orchestrates domain operations and use cases
- Handles form data parsing and validation
- Each domain has dedicated application services

**Infrastructure Layer** (`src/infrastructures/`):
- Repository implementations (Prisma ORM)
- External service integrations (auth, i18n, observability)
- Technical concerns (MinIO, logging, monitoring)

**Main domains**: `articles`, `notes`, `images`, `books` with supporting domains for `auth` and `common` utilities

### Database Architecture
Content management system with clean domain architecture:
- **Core models**: `Article`, `Note`, `Image`, `Book` - Content management with status tracking
- **Supporting models**: `Category` - Hierarchical organization for Article items
- **Common status lifecycle**: `UNEXPORTED` → `EXPORTED` (all content types)
- **User isolation**: All models include `userId` for multi-tenant data separation

**Model details**:
- **Article**: News/link management with OG metadata and category association
- **Note**: Markdown-based content creation and management
- **Image**: File metadata tracking with tags, dimensions, and MinIO path storage
- **Book**: ISBN-based book tracking with Google Books API integration and ratings

Schema is maintained in `prisma/schema.prisma` with String-based primary keys and comprehensive unique constraints per user.

### Key Patterns
- **Server Actions**: All mutations use Next.js server actions with `wrapServerSideErrorForClient`
- **Role-based Auth**: `viewer`/`dumper` roles via Auth0 + NextAuth.js
- **Error Handling**: Custom error classes with Pushover notifications and Sentry monitoring
- **Validation**: Zod schemas for all input validation
- **UI Components**: Shadcn/ui foundation with Storybook documentation

### External Services
- **Database**: PostgreSQL with Prisma ORM (schema in `prisma/`)
- **Object Storage**: MinIO (configurable, can be local or cloud)
- **Monitoring**: Sentry for error tracking, Pushover for notifications
- **Auth**: Auth0 integration via NextAuth.js
- **Internationalization**: next-intl for Japanese/English support

### Type Safety
- End-to-end TypeScript with `@t3-oss/env-nextjs` for environment variables
- Zod for runtime validation
- Custom utility types in `src/types.ts`

## Testing

### Vitest Workspace Configuration
The project uses Vitest workspace to manage tests across multiple packages:
- **Workspace Root**: `vitest.config.ts` defines three test projects (app, ui, core)
- **Individual Configs**: Each package has its own `vitest.config.ts` with specific settings
- **Unified Execution**: Run all tests from the root with `pnpm test`
- **Selective Testing**: Test individual packages with `pnpm test:app`, `pnpm test:components`, or `pnpm test:core`

### Test Setup per Package
- **app**: jsdom environment with Next.js-specific mocks (auth, prisma, minio, env)
  - Location: [app/vitest.config.ts](app/vitest.config.ts)
  - Setup file: [app/vitest-setup.tsx](app/vitest-setup.tsx)
  - Includes Storybook integration with browser testing
- **packages/ui**: jsdom environment for React component testing
  - Location: [packages/ui/vitest.config.ts](packages/ui/vitest.config.ts)
  - Setup file: [packages/ui/vitest-setup.tsx](packages/ui/vitest-setup.tsx)
- **packages/core**: Node environment for domain logic testing
  - Location: [packages/core/vitest.config.ts](packages/core/vitest.config.ts)
  - Setup file: [packages/core/vitest-setup.tsx](packages/core/vitest-setup.tsx)

### Test Technologies
- **Test Framework**: Vitest with `@testing-library/react` for component tests
- **Coverage**: `@vitest/coverage-v8` enabled for all packages
- **Type Checking**: TypeScript type checking enabled in tests
- **Storybook**: Component testing with coverage support and Playwright browser testing

## Code Style & Architecture Rules

### Formatters and Linters
- **Primary Formatter**: Biome (not Prettier) - Use `pnpm biome:fix` for comprehensive formatting and linting
  - Includes import organization, code style enforcement, and TypeScript-specific rules
  - Configured with strict style rules and accessibility checks
- **Complementary Linter**: ESLint for React/Next.js specific rules
  - TypeScript strict configuration with React hooks enforcement
  - Next.js plugin integration for framework-specific best practices
  - Storybook and Vitest plugin support for testing environments

### Architecture Rules
- **Package Manager**: pnpm (required)
- **Import Rules**: No relative imports going up directories (`../../*`) - use absolute imports
- **Domain Boundaries**: Cross-domain imports forbidden - each domain is isolated following clean architecture
- **Component Conventions**: TypeScript interfaces as `type` (not `interface`), React hooks rules enforced
- **Dependency Management**: Dependency cruiser configured to detect circular dependencies and architectural violations

### Configuration Files
- `biome.json` - Primary formatter/linter configuration with strict TypeScript and accessibility rules
- `eslint.config.ts` - Complementary ESLint setup for React/Next.js specific rules
- `.dependency-cruiser.cjs` - Architectural boundary enforcement and circular dependency detection

## Environment Variables

Environment variables are managed using `@t3-oss/env-nextjs` with Zod validation in `src/env.ts`. This ensures type safety and prevents builds with invalid configurations.

### Required Environment Variables

**Authentication (Auth0)**:
- `AUTH_SECRET` - NextAuth.js secret (generate with `openssl rand -base64 32`)
- `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_ISSUER_BASE_URL` - Auth0 configuration

**Database**:
- `DATABASE_URL` - PostgreSQL connection string

**External Services**:
- `PUSHOVER_URL`, `PUSHOVER_USER_KEY`, `PUSHOVER_APP_TOKEN` - Notification service
- `SENTRY_AUTH_TOKEN`, `SENTRY_REPORT_URL` - Error monitoring
- `NEXT_PUBLIC_SENTRY_DSN` - Client-side Sentry (public variable)

**Object Storage (MinIO)**:
- `MINIO_HOST`, `MINIO_PORT`, `MINIO_BUCKET_NAME` - MinIO server configuration
- `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` - MinIO credentials

### Development Setup
Copy `.env.sample` to `.env.local` and fill in required values. For development database, use the provided Docker Compose setup with PostgreSQL.
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Essential Commands
- **Development**: `pnpm dev` - Start Next.js development server
- **Build**: `pnpm build` - Build the application
- **Lint**: `pnpm lint` or `pnpm lint:fix` - ESLint checking/fixing
- **Lint Inspector**: `pnpm lint:inspector` - ESLint configuration inspector
- **Biome**: `pnpm biome:fix` - Biome formatting and linting
- **Biome CI**: `pnpm biome:ci` - Biome CI checking (non-interactive)
- **Test**: `pnpm test` - Run Vitest unit tests
- **Test with Type Check**: `pnpm test:typecheck` - Run TypeScript type checking on test files only
- **Test All**: `pnpm test:all` - Run unit tests and type checking
- **Storybook**: `pnpm storybook` - Component development
- **Storybook Build**: `pnpm storybook:build` - Build static Storybook
- **Storybook Test**: `pnpm test:storybook` - Run Storybook test runner with coverage

### Code Quality & Analysis
- **Check Dependencies**: `pnpm deps:check` - Analyze dependencies and detect issues
- **Generate Dependency Graph**: `pnpm deps:graph` - Create visual dependency graph (SVG)
- **Find Circular Dependencies**: `pnpm deps:circular` - Detect circular dependencies
- **Bundle Analysis**: `pnpm analyze` - Analyze Next.js bundle size
- **Dead Code Detection**: `pnpm knip` - Find unused files and dependencies
- **Copy-Paste Detection**: `pnpm jscpd` - Detect code duplication
- **Security Audit**: `pnpm security` - Check for vulnerabilities

### Database Operations
- **Generate Prisma**: `pnpm prisma:generate` - Generate Prisma client
- **Database Migration**: `pnpm prisma:migrate` - Apply schema changes
- **Database Studio**: `pnpm prisma:studio` - Visual database browser
- **Deploy Migration**: `pnpm prisma:deploy` - Production deployment

### Additional Tools
- **License Summary**: `pnpm license:summary` - Generate library license summary
- **Post Install**: `pnpm postinstall` - Auto-generate Prisma client after installation

### Development Setup
```bash
pnpm install
docker compose up --build -d  # Start PostgreSQL database
pnpm dev
```

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

Schema is maintained in `s-schema/schema.prisma` with String-based primary keys and comprehensive unique constraints per user.

### Key Patterns
- **Server Actions**: All mutations use Next.js server actions with `wrapServerSideErrorForClient`
- **Role-based Auth**: `viewer`/`dumper` roles via Auth0 + NextAuth.js
- **Error Handling**: Custom error classes with Pushover notifications and Sentry monitoring
- **Validation**: Zod schemas for all input validation
- **UI Components**: Shadcn/ui foundation with Storybook documentation

### External Services
- **Database**: PostgreSQL with Prisma ORM (schema in `s-schema/`)
- **Object Storage**: MinIO (configurable, can be local or cloud)
- **Monitoring**: Sentry for error tracking, Pushover for notifications
- **Auth**: Auth0 integration via NextAuth.js
- **Internationalization**: next-intl for Japanese/English support

### Type Safety
- End-to-end TypeScript with `@t3-oss/env-nextjs` for environment variables
- Zod for runtime validation
- Custom utility types in `src/types.ts`

## Testing
- **Unit Tests**: Vitest with `@testing-library/react`
- **Storybook**: Component testing with coverage support

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
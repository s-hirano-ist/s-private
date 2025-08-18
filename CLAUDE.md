# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Essential Commands
- **Development**: `pnpm dev` - Start Next.js development server
- **Build**: `pnpm build` - Build the application
- **Lint**: `pnpm lint` or `pnpm lint:fix` - ESLint checking/fixing
- **Biome**: `pnpm biome:fix` - Biome formatting
- **Test**: `pnpm test` - Run Vitest unit tests
- **E2E Test**: `pnpm test:e2e` - Run Playwright tests
- **Storybook**: `pnpm storybook` - Component development

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
  - Dumper section: `@contents`, `@dump`, `@image`, `@news`
  - Viewer section: `@books`, `@contents`, `@images`, `@news`

### Feature Organization
Features follow domain-driven design in `src/features/`:
- `actions/` - Server actions with "use server" directive
- `components/` - Domain-specific React components  
- `schemas/` - Zod validation schemas
- `utils/` - Domain utility functions

Main domains: `ai`, `auth`, `contents`, `dump`, `image`, `news`, `viewer`

### Database Architecture
Content management system with single-tier architecture:
- **Core tables**: `News`, `Contents`, `Images`, `Books` - Content management with status tracking
- **Supporting tables**: `Categories` - Hierarchical organization for News items

Status lifecycle: `UNEXPORTED` → `EXPORTED`

Schema is maintained in `s-schema/schema.prisma` with UUID-based primary keys for improved performance and scalability.

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
- **E2E Tests**: Playwright configuration in `playwright.config.ts`
- **Storybook**: Component testing with coverage support

## Code Style & Architecture Rules
- **Formatter**: Biome (not Prettier) - Use `pnpm biome:fix` for formatting
- **Linter**: ESLint with strict configuration including boundaries plugin
- **Package Manager**: pnpm (required)
- **Import Rules**: No relative imports going up directories (`../../*`) - use absolute imports
- **Feature Boundaries**: Cross-feature imports forbidden - each feature domain is isolated
- **Component Conventions**: TypeScript interfaces as `type` (not `interface`), React hooks rules enforced
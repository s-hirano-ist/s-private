# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Essential Commands
- **Development**: `pnpm dev` - Start Next.js development server
- **Build**: `pnpm build` - Build the application
- **Lint**: `pnpm lint` or `pnpm lint:fix` - ESLint checking/fixing
- **Format**: `pnpm fmt:fix` - Biome formatting
- **Test**: `pnpm test` - Run Vitest unit tests
- **E2E Test**: `pnpm test:e2e` - Run Playwright tests
- **Storybook**: `pnpm storybook` - Component development

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
Two-tier system:
- **Dumper tables** (`News`, `Contents`, `Images`) - Data entry with status tracking
- **Static tables** (`StaticNews`, `StaticContents`, `StaticBooks`) - Optimized for viewing

Status lifecycle: `UNEXPORTED` → `UPDATED_RECENTLY` → `EXPORTED`

### Key Patterns
- **Server Actions**: All mutations use Next.js server actions with `wrapServerSideErrorForClient`
- **Role-based Auth**: `viewer`/`dumper` roles via Auth0 + NextAuth.js
- **Error Handling**: Custom error classes with Pushover notifications and Sentry monitoring
- **Validation**: Zod schemas for all input validation
- **UI Components**: Shadcn/ui foundation with Storybook documentation

### External Services
- **Database**: PostgreSQL with Prisma ORM (schema in `s-schema/`)
- **Storage**: MinIO for object storage
- **Monitoring**: Sentry for errors, Pushover for notifications
- **Auth**: Auth0 integration via NextAuth.js

### Type Safety
- End-to-end TypeScript with `@t3-oss/env-nextjs` for environment variables
- Zod for runtime validation
- Custom utility types in `src/types.ts`

## Testing
- **Unit Tests**: Vitest with `@testing-library/react`
- **E2E Tests**: Playwright configuration in `playwright.config.ts`
- **Storybook**: Component testing with coverage support

## Code Style
- **Formatter**: Biome (not Prettier)
- **Linter**: ESLint with multiple plugins (unicorn, perfectionist, etc.)
- **Package Manager**: pnpm (required)
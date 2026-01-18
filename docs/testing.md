# Testing

## Commands

- `pnpm test` - Run all Vitest unit tests (workspace-wide)
- `pnpm test:typecheck` - Run TypeScript type checking on test files only
- `pnpm test:all` - Run all unit tests and type checking

## Vitest Workspace Configuration

The project uses Vitest workspace to manage tests across multiple packages:
- **Workspace Root**: `vitest.config.ts` defines three test projects (app, ui, core)
- **Individual Configs**: Each package has its own `vitest.config.ts` with specific settings
- **Unified Execution**: Run all tests from the root with `pnpm test`

## Test Setup per Package

### app
- **Environment**: jsdom with Next.js-specific mocks (auth, prisma, minio, env)
- **Config**: [app/vitest.config.ts](../app/vitest.config.ts)
- **Setup**: [app/vitest-setup.tsx](../app/vitest-setup.tsx)
- **Features**: Includes Storybook integration with browser testing

### packages/ui
- **Environment**: jsdom for React component testing
- **Config**: [packages/ui/vitest.config.ts](../packages/ui/vitest.config.ts)
- **Setup**: [packages/ui/vitest-setup.tsx](../packages/ui/vitest-setup.tsx)

### packages/core
- **Environment**: Node for domain logic testing
- **Config**: [packages/core/vitest.config.ts](../packages/core/vitest.config.ts)
- **Setup**: [packages/core/vitest-setup.tsx](../packages/core/vitest-setup.tsx)

## Technologies

- **Test Framework**: Vitest with `@testing-library/react` for component tests
- **Coverage**: `@vitest/coverage-v8` enabled for all packages
- **Type Checking**: TypeScript type checking enabled in tests
- **Storybook**: Component testing with coverage support and Playwright browser testing

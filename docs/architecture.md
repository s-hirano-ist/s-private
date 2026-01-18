# Architecture

## Clean Architecture Organization

The codebase follows clean architecture with domain-driven design:

### Domain Layer (`src/domains/`)
- `entities/` - Core business logic and domain entities
- `repositories/` - Repository interfaces (dependency inversion)
- `services/` - Domain services for complex business logic
- `types/` - Domain-specific types and constants

### Application Services Layer (`src/application-services/`)
- Orchestrates domain operations and use cases
- Handles form data parsing and validation
- Each domain has dedicated application services

### Infrastructure Layer (`src/infrastructures/`)
- Repository implementations (Prisma ORM)
- External service integrations (auth, i18n, observability)
- Technical concerns (MinIO, logging, monitoring)

**Main domains**: `articles`, `notes`, `images`, `books` with supporting domains for `auth` and `common` utilities

## Database Architecture

Content management system with clean domain architecture:
- **Core models**: `Article`, `Note`, `Image`, `Book` - Content management with status tracking
- **Supporting models**: `Category` - Hierarchical organization for Article items
- **Common status lifecycle**: `UNEXPORTED` → `EXPORTED` (all content types)
- **User isolation**: All models include `userId` for multi-tenant data separation

### Model Details
- **Article**: News/link management with OG metadata and category association
- **Note**: Markdown-based content creation and management
- **Image**: File metadata tracking with tags, dimensions, and MinIO path storage
- **Book**: ISBN-based book tracking with Google Books API integration and ratings

Schema is maintained in `prisma/schema.prisma` with String-based primary keys and comprehensive unique constraints per user.

## Code Style & Architecture Rules

### Formatters and Linters
- **Primary Formatter**: Biome (not Prettier) - Use `pnpm biome:fix`
  - Includes import organization, code style enforcement, and TypeScript-specific rules
  - Configured with strict style rules and accessibility checks
- **Complementary Linter**: ESLint for React/Next.js specific rules
  - TypeScript strict configuration with React hooks enforcement
  - Next.js plugin integration for framework-specific best practices

### Architecture Rules
- **Package Manager**: pnpm (required)
- **Import Rules**: No relative imports going up directories (`../../*`) - use absolute imports
- **Domain Boundaries**: Cross-domain imports forbidden - each domain is isolated
- **Component Conventions**: TypeScript interfaces as `type` (not `interface`), React hooks rules enforced
- **Dependency Management**: Dependency cruiser configured to detect circular dependencies

### Configuration Files
- `biome.json` - Primary formatter/linter configuration
- `eslint.config.ts` - Complementary ESLint setup for React/Next.js
- `.dependency-cruiser.cjs` - Architectural boundary enforcement

## Security

### Automated Dependency Management (Renovate)
- **Schedule**: Weekly updates (Mondays before 11am JST)
- **Vulnerability Alerts**: Automatic PRs for security issues (labeled `security`)
- **Supply Chain Protection**: 3-day minimum release age for patches/minors (72 hours), 24-hour global minimum
- **Configuration**: See [.github/renovate.json5](../.github/renovate.json5)

### npm/pnpm Security Settings
- **Version Pinning**: `save-exact=true` in .npmrc + `savePrefix: ''` in pnpm-workspace.yaml
- **Lifecycle Script Protection**: `ignore-dep-scripts=true` prevents malicious scripts
- **CI/CD**: `--frozen-lockfile` enforced in all CI workflows
- **Minimum Release Age**: 24-hour global setting to avoid newly published malicious packages

See [SECURITY.md](../SECURITY.md) for complete security best practices.

# s-private-domains

Domain layer for s-private application, following Clean Architecture and Domain-Driven Design principles.

## Overview

This package contains the core domain logic for the s-private content management system, including:

- **Domain Entities**: Core business objects with their invariants
- **Repository Interfaces**: Abstraction for data access (dependency inversion)
- **Domain Services**: Complex business logic that doesn't belong to a single entity
- **Domain Events**: Events emitted during domain operations
- **Value Objects & Types**: Domain-specific types and constants

## Installation

```bash
npm install s-private-domains
# or
pnpm add s-private-domains
# or
yarn add s-private-domains
```

## Usage

### Import all domains (with namespaces)

```typescript
import { Articles, Books, Notes, Images, Common, Errors } from "s-private-domains";

// Usage
const article = new Articles.ArticleEntity(...);
const book = new Books.BooksEntity(...);
const note = new Notes.NoteEntity(...);
const image = new Images.ImageEntity(...);
```

### Import specific domain (recommended)

```typescript
// Articles domain
import { ArticleEntity, ArticlesDomainService } from "s-private-domains/articles";

// Books domain
import { BooksEntity, BooksDomainService } from "s-private-domains/books";

// Notes domain
import { NoteEntity, NotesDomainService } from "s-private-domains/notes";

// Images domain
import { ImageEntity, ImagesDomainService } from "s-private-domains/images";

// Common utilities
import { CommonEntity, IdGenerator } from "s-private-domains/common";

// Error classes
import { DomainError } from "s-private-domains/errors";
```

### Importing specific exports from domain

```typescript
// Direct import from domain module
import * as Articles from "s-private-domains/articles";

// Use the exports
const service = new Articles.ArticlesDomainService();
const entity = new Articles.ArticleEntity(...);
```

## Package Structure

```
s-private-domains/
├── articles/       # Article domain (news/link management)
├── books/          # Book domain (ISBN-based tracking)
├── common/         # Shared domain utilities
├── errors/         # Domain error classes
├── images/         # Image domain (file metadata)
└── notes/          # Note domain (markdown content)
```

Each domain module contains:
- `entities/` - Domain entities
- `events/` - Domain events
- `repositories/` - Repository interfaces
- `services/` - Domain services
- `types/` - Domain-specific types

## Architecture

This package follows Clean Architecture principles:

- **Dependency Inversion**: Repository interfaces defined in domain, implementations elsewhere
- **Domain Independence**: No dependencies on frameworks or infrastructure
- **Business Logic Isolation**: Pure TypeScript domain logic

## Dependencies

- `zod` - Runtime validation
- `uuid` - ID generation
- `sharp` - Image processing types

## Development

```bash
# Build the package
pnpm build

# Clean build artifacts
pnpm clean

# Run tests (from workspace root)
pnpm test:domains
```

## License

AGPL-3.0

## Repository

https://github.com/s-hirano-ist/s-private

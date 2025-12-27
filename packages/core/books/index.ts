/**
 * @packageDocumentation
 *
 * Books domain for ISBN-based book tracking.
 *
 * @remarks
 * Provides complete domain implementation for book management including:
 *
 * - **Entities** - Book value objects and entity factory
 * - **Repositories** - Query and command repository interfaces (CQRS)
 * - **Services** - Domain service for business logic
 * - **Events** - Domain events for cross-cutting concerns
 * - **Types** - Query parameters and cache strategies
 *
 * Books integrate with Google Books API for metadata enrichment
 * (title, authors, thumbnail, page count, published date).
 *
 * @example
 * ```typescript
 * import {
 *   bookEntity,
 *   makeISBN,
 *   makeRating,
 *   BookCreatedEvent,
 * } from "@repo/core/books";
 *
 * const book = bookEntity.create({
 *   userId: makeUserId("user-123"),
 *   isbn: makeISBN("978-4-12-345678-9"),
 *   rating: makeRating(4),
 * });
 * ```
 */

// Entities
export * from "./entities/books-entity.js";

// Events
export * from "./events/book-created-event.js";
export * from "./events/book-deleted-event.js";

// Repositories
export * from "./repositories/books-command-repository.interface.js";
export * from "./repositories/books-query-repository.interface.js";

// Services
export * from "./services/books-batch-domain-service.js";
export * from "./services/books-domain-service.js";

// Types
export * from "./types/cache-strategy.js";
export * from "./types/query-params.js";
export * from "./types/sort-order.js";

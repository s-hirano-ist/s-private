/**
 * @packageDocumentation
 *
 * Articles domain for news and link management.
 *
 * @remarks
 * Provides complete domain implementation for article management including:
 *
 * - **Entities** - Article value objects and entity factory
 * - **Repositories** - Query and command repository interfaces (CQRS)
 * - **Services** - Domain service for business logic
 * - **Events** - Domain events for cross-cutting concerns
 * - **Types** - Query parameters and cache strategies
 *
 * Articles support Open Graph metadata extraction (title, description, image URL)
 * and can be organized into categories.
 *
 * @example
 * ```typescript
 * import {
 *   articleEntity,
 *   makeArticleTitle,
 *   makeUrl,
 *   ArticleCreatedEvent,
 * } from "@repo/core/articles";
 *
 * const article = articleEntity.create({
 *   userId: makeUserId("user-123"),
 *   title: makeArticleTitle("Breaking News"),
 *   url: makeUrl("https://example.com/news"),
 * });
 * ```
 */

// Entities
export * from "./entities/article-entity";

// Events
export * from "./events/article-created-event";
export * from "./events/article-deleted-event";

// Repositories
export * from "./repositories/articles-command-repository.interface";
export * from "./repositories/articles-query-repository.interface";
export * from "./repositories/category-query-repository.interface";

// Services
export * from "./services/articles-domain-service";

// Types
export * from "./types/cache-strategy";
export * from "./types/query-params";
export * from "./types/sort-order";

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
export * from "./entities/article-entity.js";

// Events
export * from "./events/article-created-event.js";
export * from "./events/article-deleted-event.js";

// Repositories
export * from "./repositories/articles-command-repository.interface.js";
export * from "./repositories/articles-query-repository.interface.js";
export * from "./repositories/category-query-repository.interface.js";

// Services
export * from "./services/articles-batch-domain-service.js";
export * from "./services/articles-domain-service.js";

// Types
export * from "./types/cache-strategy.js";
export * from "./types/query-params.js";
export * from "./types/sort-order.js";

/**
 * @packageDocumentation
 *
 * Images domain for file metadata and image processing.
 *
 * @remarks
 * Provides complete domain implementation for image management including:
 *
 * - **Entities** - Image value objects and entity factory
 * - **Repositories** - Query and command repository interfaces (CQRS)
 * - **Services** - Domain service for business logic
 * - **Events** - Domain events for cross-cutting concerns
 * - **Types** - Query parameters and cache strategies
 *
 * Images support metadata extraction (dimensions, file size, content type),
 * thumbnail generation, and tag-based organization.
 *
 * @example
 * ```typescript
 * import {
 *   imageEntity,
 *   makePath,
 *   makeTag,
 *   makeThumbnailBufferFromFile,
 *   ImageCreatedEvent,
 * } from "@repo/core/images";
 *
 * const thumbnail = await makeThumbnailBufferFromFile(file);
 * const image = imageEntity.create({
 *   userId: makeUserId("user-123"),
 *   path: makePath("uuid-image.jpg"),
 *   tags: [makeTag("nature"), makeTag("landscape")],
 * });
 * ```
 */

// Entities
export * from "./entities/image-entity";

// Events
export * from "./events/image-created-event";
export * from "./events/image-deleted-event";

// Repositories
export * from "./repositories/images-command-repository.interface";
export * from "./repositories/images-query-repository.interface";

// Services
export * from "./services/images-domain-service";

// Types
export * from "./types/cache-strategy";
export * from "./types/query-params";
export * from "./types/sort-order";

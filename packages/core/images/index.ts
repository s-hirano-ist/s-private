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
 * - **Services** - Domain service for business logic, image processor interface
 * - **Events** - Domain events for cross-cutting concerns
 * - **Types** - Query parameters and cache strategies
 *
 * Images support metadata extraction (dimensions, file size, content type),
 * thumbnail generation (via IImageProcessor), and tag-based organization.
 *
 * @example
 * ```typescript
 * import {
 *   imageEntity,
 *   makePath,
 *   makeTag,
 *   type IImageProcessor,
 *   ImageCreatedEvent,
 * } from "@repo/core/images";
 *
 * const image = imageEntity.create({
 *   userId: makeUserId("user-123"),
 *   path: makePath("uuid-image.jpg", true),
 *   contentType: makeContentType("image/jpeg"),
 *   fileSize: makeFileSize(1024),
 *   tags: [makeTag("nature"), makeTag("landscape")],
 * });
 * ```
 */

// Entities
export * from "./entities/image-entity.js";

// Events
export * from "./events/image-created-event.js";
export * from "./events/image-deleted-event.js";

// Repositories
export * from "./repositories/images-command-repository.interface.js";
export * from "./repositories/images-query-repository.interface.js";

// Services
export * from "./services/image-processor.interface.js";
export * from "./services/images-batch-domain-service.js";
export * from "./services/images-domain-service.js";

// Types
export * from "./types/cache-strategy.js";
export * from "./types/query-params.js";
export * from "./types/sort-order.js";

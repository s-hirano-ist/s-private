/**
 * @packageDocumentation
 *
 * Common utilities shared across all domains.
 *
 * @remarks
 * Provides foundational building blocks including:
 *
 * - **Entities** - Common value objects (Id, UserId, CreatedAt, Status)
 * - **Events** - Domain event infrastructure (BaseDomainEvent, SystemEvents)
 * - **Services** - Shared services (ID generation, entity factory)
 * - **Types** - Common type definitions
 *
 * @example
 * ```typescript
 * import { makeId, makeUserId, makeCreatedAt, UnexportedStatus } from "@repo/core/common";
 *
 * const id = makeId();
 * const userId = makeUserId("user-123");
 * const createdAt = makeCreatedAt();
 * const status = UnexportedStatus;
 * ```
 */

// Entities
export * from "./entities/common-entity.js";
// Note: file-entity.js exports are NOT re-exported here due to ContentType naming conflict
// with search-types.js. Import directly from "@s-hirano-ist/s-core/common/entities/file-entity"

// Events
export * from "./events/base-domain-event.js";
export * from "./events/domain-event.interface.js";
export * from "./events/system-error-event.js";
export * from "./events/system-warning-event.js";
// Repositories
export * from "./repositories/batch-command-repository.interface.js";
// Services
export * from "./services/entity-factory.js";
export * from "./services/id-generator.js";
export * from "./services/storage-service.interface.js";

// Types
export * from "./types/search-types.js";

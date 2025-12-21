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
export * from "./entities/common-entity";

// Events
export * from "./events/base-domain-event";
export * from "./events/domain-event.interface";
export * from "./events/system-error-event";
export * from "./events/system-warning-event";

// Services
export * from "./services/entity-factory";
export * from "./services/id-generator";

// Types
export * from "./types/search-types";

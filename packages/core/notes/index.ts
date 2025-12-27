/**
 * @packageDocumentation
 *
 * Notes domain for markdown-based content creation.
 *
 * @remarks
 * Provides complete domain implementation for note management including:
 *
 * - **Entities** - Note value objects and entity factory
 * - **Repositories** - Query and command repository interfaces (CQRS)
 * - **Services** - Domain service for business logic
 * - **Events** - Domain events for cross-cutting concerns
 * - **Types** - Query parameters and cache strategies
 *
 * Notes support markdown content with titles for organizing personal knowledge.
 *
 * @example
 * ```typescript
 * import {
 *   noteEntity,
 *   makeNoteTitle,
 *   makeMarkdown,
 *   NoteCreatedEvent,
 * } from "@repo/core/notes";
 *
 * const note = noteEntity.create({
 *   userId: makeUserId("user-123"),
 *   title: makeNoteTitle("Meeting Notes"),
 *   content: makeMarkdown("# Agenda\n- Item 1\n- Item 2"),
 * });
 * ```
 */

// Entities
export * from "./entities/note-entity.js";

// Events
export * from "./events/note-created-event.js";
export * from "./events/note-deleted-event.js";

// Repositories
export * from "./repositories/notes-command-repository.interface.js";
export * from "./repositories/notes-query-repository.interface.js";

// Services
export * from "./services/notes-domain-service.js";

// Types
export * from "./types/cache-strategy.js";
export * from "./types/query-params.js";
export * from "./types/sort-order.js";

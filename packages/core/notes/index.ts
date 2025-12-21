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
export * from "./entities/note-entity";

// Events
export * from "./events/note-created-event";
export * from "./events/note-deleted-event";

// Repositories
export * from "./repositories/notes-command-repository.interface";
export * from "./repositories/notes-query-repository.interface";

// Services
export * from "./services/notes-domain-service";

// Types
export * from "./types/cache-strategy";
export * from "./types/query-params";
export * from "./types/sort-order";

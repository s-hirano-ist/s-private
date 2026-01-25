/**
 * Note Aggregate Root and related Value Objects.
 *
 * @remarks
 * This module defines the Note aggregate root following DDD principles.
 * Note is the sole entry point for all note-related operations within
 * the Notes bounded context.
 *
 * **Aggregate Root**: {@link noteEntity}
 *
 * **Invariants**:
 * - Title must be unique per user (enforced by `NotesDomainService`)
 * - Status transitions: UNEXPORTED → LAST_UPDATED → EXPORTED
 *
 * **Value Objects defined here**:
 * - {@link NoteTitle} - Note title (1-64 chars)
 * - {@link Markdown} - Markdown content (no max length)
 *
 * @see `NotesDomainService` for domain business rules
 * @see docs/domain-model.md for aggregate boundary documentation
 * @module
 */

import { z } from "zod";
import {
	CreatedAt,
	ExportedStatus,
	Id,
	LastUpdatedStatus,
	makeCreatedAt,
	makeId,
	UnexportedStatus,
	UserId,
} from "../../shared-kernel/entities/common-entity.js";
import { createEntityWithErrorHandling } from "../../shared-kernel/services/entity-factory.js";
import { NoteCreatedEvent } from "../events/note-created-event.js";

// Value objects

/**
 * Zod schema for validating note titles.
 *
 * @remarks
 * Validates that the title is a non-empty string between 1 and 64 characters.
 *
 * @example
 * ```typescript
 * const title = NoteTitle.parse("Meeting Notes");
 * ```
 *
 * @see {@link makeNoteTitle} for factory function
 */
export const NoteTitle = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.max(64, { message: "tooLong" })
	.brand<"NoteTitle">();

/**
 * Branded type for validated note titles.
 */
export type NoteTitle = z.infer<typeof NoteTitle>;

/**
 * Creates a validated NoteTitle from a string.
 *
 * @param v - The raw title string
 * @returns A branded NoteTitle value
 * @throws {ZodError} When validation fails (empty or exceeds 64 chars)
 *
 * @example
 * ```typescript
 * const title = makeNoteTitle("Meeting Notes");
 * ```
 */
export const makeNoteTitle = (v: string): NoteTitle => NoteTitle.parse(v);

/**
 * Zod schema for validating markdown content.
 *
 * @remarks
 * Validates that the markdown is a non-empty string.
 * No maximum length is enforced to allow for long-form content.
 *
 * @example
 * ```typescript
 * const content = Markdown.parse("# Heading\n\nParagraph text");
 * ```
 *
 * @see {@link makeMarkdown} for factory function
 */
export const Markdown = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.brand<"Markdown">();

/**
 * Branded type for validated markdown content.
 */
export type Markdown = z.infer<typeof Markdown>;

/**
 * Creates a validated Markdown from a string.
 *
 * @param v - The raw markdown string
 * @returns A branded Markdown value
 * @throws {ZodError} When the string is empty
 *
 * @example
 * ```typescript
 * const content = makeMarkdown("# Heading\n\nParagraph text");
 * ```
 */
export const makeMarkdown = (v: string): Markdown => Markdown.parse(v);

// Entities

/**
 * Base schema containing common note fields.
 *
 * @internal
 */
const Base = z.object({
	id: Id,
	userId: UserId,
	title: NoteTitle,
	markdown: Markdown,
	createdAt: CreatedAt,
});

/**
 * Zod schema for an unexported note.
 *
 * @remarks
 * Represents a note that has not yet been published.
 * This is the initial state of all newly created notes.
 *
 * @see {@link ExportedNote} for the published state
 */
export const UnexportedNote = Base.extend({ status: UnexportedStatus });

/**
 * Type for an unexported note entity.
 *
 * @remarks
 * Immutable entity representing a note pending export.
 */
export type UnexportedNote = Readonly<z.infer<typeof UnexportedNote>>;

/**
 * Zod schema for a last-updated note.
 *
 * @remarks
 * Represents a note that has been modified since last export.
 * This is an intermediate state between UNEXPORTED and EXPORTED.
 *
 * @see {@link UnexportedNote} for the initial state
 * @see {@link ExportedNote} for the published state
 */
export const LastUpdatedNote = Base.extend({ status: LastUpdatedStatus });

/**
 * Type for a last-updated note entity.
 *
 * @remarks
 * Immutable entity representing a note that has been modified.
 */
export type LastUpdatedNote = Readonly<z.infer<typeof LastUpdatedNote>>;

/**
 * Zod schema for an exported note.
 *
 * @remarks
 * Represents a note that has been published.
 * Includes the exportedAt timestamp.
 *
 * @see {@link UnexportedNote} for the initial state
 */
export const ExportedNote = Base.extend(ExportedStatus.shape);

/**
 * Type for an exported note entity.
 *
 * @remarks
 * Immutable entity representing a published note.
 */
export type ExportedNote = Readonly<z.infer<typeof ExportedNote>>;

/**
 * Arguments for creating a new note.
 *
 * @remarks
 * Provides the required fields for note creation.
 * The id, createdAt, and status are auto-generated.
 *
 * @example
 * ```typescript
 * const args: CreateNoteArgs = {
 *   userId: makeUserId("user-123"),
 *   title: makeNoteTitle("Meeting Notes"),
 *   markdown: makeMarkdown("# Meeting Notes\n\n- Item 1\n- Item 2"),
 *   caller: "addNote",
 * };
 * ```
 */
export type CreateNoteArgs = Readonly<{
	/** The user who owns the note */
	userId: UserId;
	/** The note title */
	title: NoteTitle;
	/** The markdown content */
	markdown: Markdown;
	/** The caller identifier for event tracking */
	caller: string;
}>;

/**
 * Return type for note creation: tuple of [entity, event].
 */
export type NoteWithEvent = readonly [UnexportedNote, NoteCreatedEvent];

/**
 * Factory object for Note domain entity operations.
 *
 * **This is the Aggregate Root** for the Notes bounded context.
 *
 * @remarks
 * As the aggregate root, Note is the only entry point for creating and
 * managing note entities. All note-related operations must go through
 * this factory to ensure domain invariants are maintained.
 *
 * Provides immutable entity creation following DDD patterns.
 * All returned entities are frozen using Object.freeze().
 * Returns a tuple of [entity, event] for domain event dispatching.
 *
 * @example
 * ```typescript
 * // Create a new unexported note with its domain event
 * const [note, event] = noteEntity.create({
 *   userId: makeUserId("user-123"),
 *   title: makeNoteTitle("Meeting Notes"),
 *   markdown: makeMarkdown("# Content"),
 *   caller: "addNote",
 * });
 *
 * // Persist and dispatch event
 * await repository.create(note);
 * await eventDispatcher.dispatch(event);
 * ```
 *
 * @see {@link CreateNoteArgs} for creation parameters
 * @see {@link NoteWithEvent} for return type
 * @see `NotesDomainService` for invariant validation (duplicate title check)
 */
export const noteEntity = {
	/**
	 * Creates a new unexported note entity with its domain event.
	 *
	 * @param args - The creation arguments containing required fields
	 * @returns A tuple of [UnexportedNote, NoteCreatedEvent]
	 * @throws {InvalidFormatError} When validation of any field fails
	 * @throws {UnexpectedError} For unexpected errors during creation
	 */
	create: (args: CreateNoteArgs): NoteWithEvent => {
		const { caller, ...entityArgs } = args;
		const note = createEntityWithErrorHandling(() =>
			Object.freeze({
				id: makeId(),
				status: "UNEXPORTED",
				createdAt: makeCreatedAt(),
				...entityArgs,
			}),
		);

		const event = new NoteCreatedEvent({
			title: note.title,
			markdown: note.markdown,
			userId: note.userId,
			caller,
		});

		return [note, event] as const;
	},
};

// DTO Types

/**
 * DTO for note list display.
 */
export type NoteListItemDTO = Readonly<{
	id: Id;
	title: NoteTitle;
}>;

/**
 * DTO for note search results.
 */
export type NoteSearchItemDTO = Readonly<{
	id: Id;
	title: NoteTitle;
	markdown: Markdown;
}>;

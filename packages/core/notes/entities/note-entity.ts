import { z } from "zod";
import {
	CreatedAt,
	ExportedStatus,
	Id,
	makeCreatedAt,
	makeExportedStatus,
	makeId,
	UnexportedStatus,
	UserId,
} from "../../common/entities/common-entity";
import { createEntityWithErrorHandling } from "../../common/services/entity-factory";

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
}>;

/**
 * Factory object for Note domain entity operations.
 *
 * @remarks
 * Provides immutable entity creation following DDD patterns.
 * All returned entities are frozen using Object.freeze().
 *
 * @example
 * ```typescript
 * // Create a new unexported note
 * const note = noteEntity.create({
 *   userId: makeUserId("user-123"),
 *   title: makeNoteTitle("Meeting Notes"),
 *   markdown: makeMarkdown("# Content"),
 * });
 *
 * // Export the note (changes status to EXPORTED)
 * const exported = noteEntity.export(note);
 * ```
 *
 * @see {@link CreateNoteArgs} for creation parameters
 */
export const noteEntity = {
	/**
	 * Creates a new unexported note entity.
	 *
	 * @param args - The creation arguments containing required fields
	 * @returns A frozen UnexportedNote instance with generated id and timestamps
	 * @throws {InvalidFormatError} When validation of any field fails
	 * @throws {UnexpectedError} For unexpected errors during creation
	 */
	create: (args: CreateNoteArgs): UnexportedNote => {
		return createEntityWithErrorHandling(() =>
			Object.freeze({
				id: makeId(),
				status: "UNEXPORTED",
				createdAt: makeCreatedAt(),
				...args,
			}),
		);
	},

	/**
	 * Transitions a note from UNEXPORTED to EXPORTED status.
	 *
	 * @param note - The unexported note to export
	 * @returns A frozen ExportedNote with exportedAt timestamp
	 * @throws {InvalidFormatError} When the note state is invalid
	 * @throws {UnexpectedError} For unexpected errors during export
	 */
	export: (note: UnexportedNote): ExportedNote => {
		return createEntityWithErrorHandling(() => {
			const exportedStatus = makeExportedStatus();
			return Object.freeze({
				...note,
				...exportedStatus,
			});
		});
	},
};

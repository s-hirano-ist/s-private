import { z } from "zod";
import {
	CreatedAt,
	ExportedStatus,
	Id,
	LastUpdatedStatus,
	makeCreatedAt,
	makeExportedStatus,
	makeId,
	UnexportedStatus,
	UserId,
} from "../../common/entities/common-entity";
import { createEntityWithErrorHandling } from "../../common/services/entity-factory";

// Value objects

/**
 * Zod schema for validating ISBN identifiers.
 *
 * @remarks
 * Validates that the ISBN is a string of 1-17 characters containing only
 * digits and hyphens. Supports both ISBN-10 and ISBN-13 formats.
 *
 * @example
 * ```typescript
 * const isbn = ISBN.parse("978-4-06-521234-5");
 * const isbn10 = ISBN.parse("4-06-521234-X");
 * ```
 *
 * @see {@link makeISBN} for factory function
 */
export const ISBN = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.max(17, { message: "tooLong" })
	.regex(/^[\d-]+$/, { message: "invalidFormat" })
	.brand<"ISBN">();

/**
 * Branded type for validated ISBN identifiers.
 */
export type ISBN = z.infer<typeof ISBN>;

/**
 * Creates a validated ISBN from a string.
 *
 * @param v - The raw ISBN string
 * @returns A branded ISBN value
 * @throws {ZodError} When validation fails
 *
 * @example
 * ```typescript
 * const isbn = makeISBN("978-4-06-521234-5");
 * ```
 */
export const makeISBN = (v: string): ISBN => ISBN.parse(v);

/**
 * Zod schema for validating book titles.
 *
 * @remarks
 * Validates that the title is a non-empty string between 1 and 256 characters.
 *
 * @example
 * ```typescript
 * const title = BookTitle.parse("The Pragmatic Programmer");
 * ```
 *
 * @see {@link makeBookTitle} for factory function
 */
export const BookTitle = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.max(256, { message: "tooLong" })
	.brand<"BookTitle">();

/**
 * Branded type for validated book titles.
 */
export type BookTitle = z.infer<typeof BookTitle>;

/**
 * Creates a validated BookTitle from a string.
 *
 * @param v - The raw title string
 * @returns A branded BookTitle value
 * @throws {ZodError} When validation fails (empty or exceeds 256 chars)
 *
 * @example
 * ```typescript
 * const title = makeBookTitle("The Pragmatic Programmer");
 * ```
 */
export const makeBookTitle = (v: string): BookTitle => BookTitle.parse(v);

/**
 * Zod schema for Google Books API title.
 *
 * @remarks
 * Optional string for the title fetched from Google Books API.
 * Null values are allowed when no Google Books data is available.
 *
 * @see {@link makeGoogleTitle} for factory function
 */
export const GoogleTitle = z.string().nullable().brand<"GoogleTitle">();

/**
 * Branded type for Google Books API titles.
 */
export type GoogleTitle = z.infer<typeof GoogleTitle>;

/**
 * Creates a validated GoogleTitle from a string or null.
 *
 * @param v - The Google Books title, null, or undefined
 * @returns A branded GoogleTitle value
 */
export const makeGoogleTitle = (v: string | null | undefined): GoogleTitle =>
	GoogleTitle.parse(v);

/**
 * Zod schema for Google Books API subtitle.
 *
 * @remarks
 * Optional string for the subtitle fetched from Google Books API.
 *
 * @see {@link makeGoogleSubTitle} for factory function
 */
export const GoogleSubtitle = z.string().nullable().brand<"GoogleSubTitle">();

/**
 * Branded type for Google Books API subtitles.
 */
export type GoogleSubtitle = z.infer<typeof GoogleSubtitle>;

/**
 * Creates a validated GoogleSubtitle from a string or null.
 *
 * @param v - The Google Books subtitle, null, or undefined
 * @returns A branded GoogleSubtitle value
 */
export const makeGoogleSubTitle = (
	v: string | null | undefined,
): GoogleSubtitle => GoogleSubtitle.parse(v);

/**
 * Zod schema for Google Books API authors list.
 *
 * @remarks
 * Array of author names fetched from Google Books API.
 * Null when no author information is available.
 *
 * @see {@link makeGoogleAuthors} for factory function
 */
export const GoogleAuthors = z
	.array(z.string())
	.nullable()
	.brand<"GoogleAuthors">();

/**
 * Branded type for Google Books API authors.
 */
export type GoogleAuthors = z.infer<typeof GoogleAuthors>;

/**
 * Creates a validated GoogleAuthors from an array or null.
 *
 * @param v - The authors array, null, or undefined
 * @returns A branded GoogleAuthors value
 */
export const makeGoogleAuthors = (
	v: string[] | null | undefined,
): GoogleAuthors => GoogleAuthors.parse(v);

/**
 * Zod schema for Google Books API description.
 *
 * @remarks
 * Book description/synopsis fetched from Google Books API.
 *
 * @see {@link makeGoogleDescription} for factory function
 */
export const GoogleDescription = z
	.string()
	.nullable()
	.brand<"GoogleDescription">();

/**
 * Branded type for Google Books API descriptions.
 */
export type GoogleDescription = z.infer<typeof GoogleDescription>;

/**
 * Creates a validated GoogleDescription from a string or null.
 *
 * @param v - The description, null, or undefined
 * @returns A branded GoogleDescription value
 */
export const makeGoogleDescription = (
	v: string | null | undefined,
): GoogleDescription => GoogleDescription.parse(v);

/**
 * Zod schema for Google Books API cover image URL.
 *
 * @remarks
 * URL to the book cover image from Google Books API.
 *
 * @see {@link makeGoogleImgSrc} for factory function
 */
export const GoogleImgSrc = z.string().nullable().brand<"GoogleImgSrc">();

/**
 * Branded type for Google Books API image URLs.
 */
export type GoogleImgSrc = z.infer<typeof GoogleImgSrc>;

/**
 * Creates a validated GoogleImgSrc from a string or null.
 *
 * @param v - The image URL, null, or undefined
 * @returns A branded GoogleImgSrc value
 */
export const makeGoogleImgSrc = (v: string | null | undefined): GoogleImgSrc =>
	GoogleImgSrc.parse(v);

/**
 * Zod schema for Google Books API link URL.
 *
 * @remarks
 * URL to the book's page on Google Books.
 *
 * @see {@link makeGoogleHref} for factory function
 */
export const GoogleHref = z.string().nullable().brand<"GoogleHref">();

/**
 * Branded type for Google Books API links.
 */
export type GoogleHref = z.infer<typeof GoogleHref>;

/**
 * Creates a validated GoogleHref from a string or null.
 *
 * @param v - The link URL, null, or undefined
 * @returns A branded GoogleHref value
 */
export const makeGoogleHref = (v: string | null | undefined): GoogleHref =>
	GoogleHref.parse(v);

/**
 * Zod schema for book markdown content.
 *
 * @remarks
 * Markdown-formatted notes or review content for the book.
 *
 * @see {@link makeBookMarkdown} for factory function
 */
export const BookMarkdown = z.string().nullable().brand<"BookMarkdown">();

/**
 * Branded type for book markdown content.
 */
export type BookMarkdown = z.infer<typeof BookMarkdown>;

/**
 * Creates a validated BookMarkdown from a string or null.
 *
 * @param v - The markdown content or null
 * @returns A branded BookMarkdown value
 */
export const makeBookMarkdown = (v: string | null): BookMarkdown =>
	BookMarkdown.parse(v);

// Entities

/**
 * Base schema containing common book fields.
 *
 * @internal
 */
const Base = z.object({
	id: Id,
	userId: UserId,
	ISBN: ISBN,
	title: BookTitle,
	googleTitle: GoogleTitle.optional(),
	googleSubtitle: GoogleSubtitle.optional(),
	googleAuthors: GoogleAuthors.optional(),
	googleDescription: GoogleDescription.optional(),
	googleImgSrc: GoogleImgSrc.optional(),
	googleHref: GoogleHref.optional(),
	markdown: BookMarkdown.optional(),
	createdAt: CreatedAt,
});

/**
 * Zod schema for an unexported book.
 *
 * @remarks
 * Represents a book that has not yet been published.
 * This is the initial state of all newly created books.
 *
 * @see {@link ExportedBook} for the published state
 */
export const UnexportedBook = Base.extend({ status: UnexportedStatus });

/**
 * Type for an unexported book entity.
 *
 * @remarks
 * Immutable entity representing a book pending export.
 */
export type UnexportedBook = Readonly<z.infer<typeof UnexportedBook>>;

/**
 * Zod schema for an exported book.
 *
 * @remarks
 * Represents a book that has been published.
 * Includes the exportedAt timestamp.
 *
 * @see {@link UnexportedBook} for the initial state
 */
export const ExportedBook = Base.extend(ExportedStatus.shape);

/**
 * Type for an exported book entity.
 *
 * @remarks
 * Immutable entity representing a published book.
 */
export type ExportedBook = Readonly<z.infer<typeof ExportedBook>>;

/**
 * Zod schema for a book marked for export in the current batch.
 *
 * @remarks
 * Represents a book that has been marked for export but not yet finalized.
 * This intermediate state allows for batch processing with revert capability.
 *
 * @see {@link UnexportedBook} for the initial state
 * @see {@link ExportedBook} for the final state
 */
export const LastUpdatedBook = Base.extend({ status: LastUpdatedStatus });

/**
 * Type for a book marked for export.
 *
 * @remarks
 * Immutable entity representing a book in the current export batch.
 * Can be reverted back to UnexportedBook or finalized to ExportedBook.
 */
export type LastUpdatedBook = Readonly<z.infer<typeof LastUpdatedBook>>;

/**
 * Arguments for creating a new book.
 *
 * @remarks
 * Provides the required fields for book creation.
 * The id, createdAt, and status are auto-generated.
 *
 * @example
 * ```typescript
 * const args: CreateBookArgs = {
 *   userId: makeUserId("user-123"),
 *   ISBN: makeISBN("978-4-06-521234-5"),
 *   title: makeBookTitle("The Pragmatic Programmer"),
 * };
 * ```
 */
export type CreateBookArgs = Readonly<{
	/** The user who owns the book */
	userId: UserId;
	/** The book's ISBN identifier */
	ISBN: ISBN;
	/** The book title */
	title: BookTitle;
}>;

/**
 * Factory object for Book domain entity operations.
 *
 * @remarks
 * Provides immutable entity creation following DDD patterns.
 * All returned entities are frozen using Object.freeze().
 *
 * @example
 * ```typescript
 * // Create a new unexported book
 * const book = bookEntity.create({
 *   userId: makeUserId("user-123"),
 *   ISBN: makeISBN("978-4-06-521234-5"),
 *   title: makeBookTitle("The Pragmatic Programmer"),
 * });
 *
 * // Export the book (changes status to EXPORTED)
 * const exported = bookEntity.export(book);
 * ```
 *
 * @see {@link CreateBookArgs} for creation parameters
 */
export const bookEntity = {
	/**
	 * Creates a new unexported book entity.
	 *
	 * @param args - The creation arguments containing required fields
	 * @returns A frozen UnexportedBook instance with generated id and timestamps
	 * @throws {InvalidFormatError} When validation of any field fails
	 * @throws {UnexpectedError} For unexpected errors during creation
	 */
	create: (args: CreateBookArgs): UnexportedBook => {
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
	 * Transitions a book from UNEXPORTED to EXPORTED status.
	 *
	 * @param book - The unexported book to export
	 * @returns A frozen ExportedBook with exportedAt timestamp
	 * @throws {InvalidFormatError} When the book state is invalid
	 * @throws {UnexpectedError} For unexpected errors during export
	 */
	export: (book: UnexportedBook): ExportedBook => {
		return createEntityWithErrorHandling(() => {
			const exportedStatus = makeExportedStatus();
			return Object.freeze({
				...book,
				...exportedStatus,
			});
		});
	},

	/**
	 * Marks a book for export in the current batch.
	 *
	 * @remarks
	 * Transitions from UNEXPORTED to LAST_UPDATED status.
	 * This allows for batch processing with revert capability.
	 *
	 * @param book - The unexported book to mark
	 * @returns A frozen LastUpdatedBook
	 * @throws {InvalidFormatError} When the book state is invalid
	 * @throws {UnexpectedError} For unexpected errors
	 */
	markAsLastUpdated: (book: UnexportedBook): LastUpdatedBook => {
		return createEntityWithErrorHandling(() =>
			Object.freeze({
				...book,
				status: "LAST_UPDATED" as const,
			}),
		);
	},

	/**
	 * Reverts a book from LAST_UPDATED back to UNEXPORTED.
	 *
	 * @remarks
	 * Use this when batch processing fails and needs to be rolled back.
	 *
	 * @param book - The last updated book to revert
	 * @returns A frozen UnexportedBook
	 * @throws {InvalidFormatError} When the book state is invalid
	 * @throws {UnexpectedError} For unexpected errors
	 */
	revert: (book: LastUpdatedBook): UnexportedBook => {
		return createEntityWithErrorHandling(() =>
			Object.freeze({
				...book,
				status: "UNEXPORTED" as const,
			}),
		);
	},

	/**
	 * Finalizes a book from LAST_UPDATED to EXPORTED.
	 *
	 * @remarks
	 * Use this after batch processing succeeds to confirm the export.
	 *
	 * @param book - The last updated book to finalize
	 * @returns A frozen ExportedBook with exportedAt timestamp
	 * @throws {InvalidFormatError} When the book state is invalid
	 * @throws {UnexpectedError} For unexpected errors
	 */
	finalize: (book: LastUpdatedBook): ExportedBook => {
		return createEntityWithErrorHandling(() => {
			const exportedStatus = makeExportedStatus();
			return Object.freeze({
				...book,
				...exportedStatus,
			});
		});
	},
};

/**
 * Book Aggregate Root and related Value Objects.
 *
 * @remarks
 * This module defines the Book aggregate root following DDD principles.
 * Book is the sole entry point for all book-related operations within
 * the Books bounded context.
 *
 * **Aggregate Root**: {@link bookEntity}
 *
 * **Invariants**:
 * - ISBN must be unique per user (enforced by `BooksDomainService`)
 * - Status transitions: UNEXPORTED → LAST_UPDATED → EXPORTED
 *
 * **Value Objects defined here**:
 * - {@link ISBN} - Book ISBN identifier (ISBN-10 or ISBN-13)
 * - {@link BookTitle} - Book title (1-256 chars)
 * - {@link GoogleTitle}, {@link GoogleSubtitle}, {@link GoogleAuthors},
 *   {@link GoogleDescription}, {@link GoogleImgSrc}, {@link GoogleHref} - Google Books API metadata
 * - {@link BookMarkdown} - User notes/review content
 *
 * @see `BooksDomainService` for domain business rules
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
} from "../../shared-kernel/entities/common-entity.ts";
import { Path } from "../../shared-kernel/entities/file-entity.ts";
import { createEntityWithErrorHandling } from "../../shared-kernel/services/entity-factory.ts";
import { isValidHttpUrl } from "../../shared-kernel/services/url-validation.ts";
import { BookCreatedEvent } from "../events/book-created-event.ts";

// Value objects

/**
 * Zod schema for validating ISBN identifiers.
 *
 * @remarks
 * Normalizes the input by stripping all hyphens, then validates that the
 * result is exactly 13 digits (ISBN-13). ISBN-10 is not supported.
 *
 * @example
 * ```typescript
 * const isbn = ISBN.parse("978-4-06-521234-5"); // "9784065212345"
 * const same = ISBN.parse("9784065212345");     // "9784065212345"
 * ```
 *
 * @see {@link makeISBN} for factory function
 */
export const ISBN = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.transform((v) => v.replace(/-/g, ""))
	.pipe(
		z
			.string()
			.regex(/^\d{13}$/, { message: "invalidFormat" })
			.brand<"ISBN">(),
	);

/**
 * Branded type for validated ISBN identifiers.
 */
export type ISBN = z.infer<typeof ISBN>;

/**
 * Creates a validated ISBN from a string.
 *
 * Hyphens in the input are stripped automatically; the result is always
 * the normalized 13-digit form.
 *
 * @param v - The raw ISBN string (with or without hyphens)
 * @returns A branded ISBN value (13 digits, no hyphens)
 * @throws {ZodError} When the input is not exactly 13 digits after
 *   stripping hyphens, or contains non-digit characters.
 *
 * @example
 * ```typescript
 * const isbn = makeISBN("978-4-06-521234-5"); // "9784065212345"
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
export const GoogleTitle = z
	.string()
	.max(512, { message: "tooLong" })
	.nullable()
	.brand<"GoogleTitle">();

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
export const GoogleSubtitle = z
	.string()
	.max(512, { message: "tooLong" })
	.nullable()
	.brand<"GoogleSubTitle">();

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
export const GoogleImgSrc = z
	.string()
	.max(1024, { message: "tooLong" })
	.refine(isValidHttpUrl, { message: "invalidFormat" })
	.nullable()
	.brand<"GoogleImgSrc">();

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
export const GoogleHref = z
	.string()
	.max(1024, { message: "tooLong" })
	.refine(isValidHttpUrl, { message: "invalidFormat" })
	.nullable()
	.brand<"GoogleHref">();

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
 * Zod schema for book rating.
 *
 * @remarks
 * Integer between 1 and 5 inclusive. Required for all book entries.
 *
 * @see {@link makeRating} for factory function
 */
export const Rating = z
	.number({ message: "required" })
	.int({ message: "invalidFormat" })
	.min(1, { message: "outOfRange" })
	.max(5, { message: "outOfRange" })
	.brand<"Rating">();

/**
 * Branded type for validated book ratings.
 */
export type Rating = z.infer<typeof Rating>;

/**
 * Creates a validated Rating from a number.
 *
 * @param v - The rating value (integer between 1 and 5)
 * @returns A branded Rating value
 * @throws {ZodError} When the input is not an integer or out of the 1-5 range.
 */
export const makeRating = (v: number): Rating => Rating.parse(v);

/**
 * Zod schema for book tags.
 *
 * @remarks
 * An array of short string tags used for categorization. Each tag must be
 * between 1 and 64 characters. An empty array is permitted when the caller
 * does not wish to assign any tag.
 *
 * @see {@link makeTags} for factory function
 */
export const Tags = z
	.array(
		z.string().min(1, { message: "required" }).max(64, { message: "tooLong" }),
	)
	.brand<"Tags">();

/**
 * Branded type for validated book tags.
 */
export type Tags = z.infer<typeof Tags>;

/**
 * Creates a validated Tags array.
 *
 * @param v - The tags array (may be empty)
 * @returns A branded Tags value
 */
export const makeTags = (v: string[]): Tags => Tags.parse(v);

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
	isbn: ISBN,
	title: BookTitle,
	rating: Rating.optional(),
	tags: Tags.optional(),
	googleTitle: GoogleTitle.optional(),
	googleSubTitle: GoogleSubtitle.optional(),
	googleAuthors: GoogleAuthors.optional(),
	googleDescription: GoogleDescription.optional(),
	googleImgSrc: GoogleImgSrc.optional(),
	googleHref: GoogleHref.optional(),
	imagePath: Path.optional(),
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
 * Zod schema for a last-updated book.
 *
 * @remarks
 * Represents a book that has been modified since last export.
 * This is an intermediate state between UNEXPORTED and EXPORTED.
 *
 * @see {@link UnexportedBook} for the initial state
 * @see {@link ExportedBook} for the published state
 */
export const LastUpdatedBook = Base.extend({ status: LastUpdatedStatus });

/**
 * Type for a last-updated book entity.
 *
 * @remarks
 * Immutable entity representing a book that has been modified.
 */
export type LastUpdatedBook = Readonly<z.infer<typeof LastUpdatedBook>>;

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
 *   isbn: makeISBN("978-4-06-521234-5"),
 *   title: makeBookTitle("The Pragmatic Programmer"),
 *   caller: "addBook",
 * };
 * ```
 */
export type CreateBookArgs = Readonly<{
	/** The user who owns the book */
	userId: UserId;
	/** The book's ISBN identifier */
	isbn: ISBN;
	/** The book title */
	title: BookTitle;
	/** User rating, 1-5 inclusive */
	rating: Rating;
	/** Free-form categorization tags (may be empty) */
	tags: Tags;
	/** Optional path to user-uploaded book cover image */
	imagePath?: Path;
	/** The caller identifier for event tracking */
	caller: string;
}>;

/**
 * Return type for book creation: tuple of [entity, event].
 */
export type BookWithEvent = readonly [UnexportedBook, BookCreatedEvent];

/**
 * Factory object for Book domain entity operations.
 *
 * **This is the Aggregate Root** for the Books bounded context.
 *
 * @remarks
 * As the aggregate root, Book is the only entry point for creating and
 * managing book entities. All book-related operations must go through
 * this factory to ensure domain invariants are maintained.
 *
 * Provides immutable entity creation following DDD patterns.
 * All returned entities are frozen using Object.freeze().
 * Returns a tuple of [entity, event] for domain event dispatching.
 *
 * @example
 * ```typescript
 * // Create a new unexported book with its domain event
 * const [book, event] = bookEntity.create({
 *   userId: makeUserId("user-123"),
 *   isbn: makeISBN("978-4-06-521234-5"),
 *   title: makeBookTitle("The Pragmatic Programmer"),
 *   caller: "addBook",
 * });
 *
 * // Persist and dispatch event
 * await repository.create(book);
 * await eventDispatcher.dispatch(event);
 * ```
 *
 * @see {@link CreateBookArgs} for creation parameters
 * @see {@link BookWithEvent} for return type
 * @see `BooksDomainService` for invariant validation (duplicate ISBN check)
 */
export const bookEntity = {
	/**
	 * Creates a new unexported book entity with its domain event.
	 *
	 * @param args - The creation arguments containing required fields
	 * @returns A tuple of [UnexportedBook, BookCreatedEvent]
	 * @throws {InvalidFormatError} When validation of any field fails
	 * @throws {UnexpectedError} For unexpected errors during creation
	 */
	create: (args: CreateBookArgs): BookWithEvent => {
		const { caller, ...entityArgs } = args;
		const book = createEntityWithErrorHandling(() =>
			Object.freeze({
				id: makeId(),
				status: "UNEXPORTED",
				createdAt: makeCreatedAt(),
				...entityArgs,
			}),
		);

		const event = new BookCreatedEvent({
			isbn: book.isbn,
			title: book.title,
			userId: book.userId,
			caller,
		});

		return [book, event] as const;
	},
};

// DTO Types

/**
 * DTO for book list display.
 *
 * @remarks
 * Contains fields needed for list views, with branded types.
 */
export type BookListItemDTO = Readonly<{
	id: Id;
	isbn: ISBN;
	title: BookTitle;
	googleImgSrc: GoogleImgSrc | undefined;
	imagePath: Path | undefined;
	googleAuthors: GoogleAuthors | undefined;
	googleSubTitle: GoogleSubtitle | undefined;
}>;

/**
 * Article Aggregate Root and related Value Objects.
 *
 * @remarks
 * This module defines the Article aggregate root following DDD principles.
 * Article is the sole entry point for all article-related operations within
 * the Articles bounded context.
 *
 * **Aggregate Root**: {@link articleEntity}
 *
 * **Invariants**:
 * - URL must be unique per user (enforced by `ArticlesDomainService`)
 * - Status transitions: UNEXPORTED → LAST_UPDATED → EXPORTED
 *
 * **Value Objects defined here**:
 * - {@link CategoryName} - Article category identifier
 * - {@link ArticleTitle} - Article title (1-128 chars)
 * - {@link Quote} - Optional excerpt (max 512 chars)
 * - {@link Url} - HTTP/HTTPS URL
 * - {@link OgTitle}, {@link OgDescription}, {@link OgImageUrl} - Open Graph metadata
 *
 * @see `ArticlesDomainService` for domain business rules
 * @see docs/domain-model.md for aggregate boundary documentation
 * @module
 */

import { z } from "zod";
import {
	CreatedAt,
	ExportedStatus,
	Id,
	makeCreatedAt,
	makeId,
	UnexportedStatus,
	UserId,
} from "../../shared-kernel/entities/common-entity.js";
import { createEntityWithErrorHandling } from "../../shared-kernel/services/entity-factory.js";
import { ArticleCreatedEvent } from "../events/article-created-event.js";

// Value objects

/**
 * Zod schema for validating category names.
 *
 * @remarks
 * Validates that the category name is a trimmed string between 1 and 16 characters.
 * Used for organizing articles into logical groups.
 *
 * @example
 * ```typescript
 * const name = CategoryName.parse("Technology");
 * ```
 *
 * @see {@link makeCategoryName} for factory function
 */
export const CategoryName = z
	.string({ message: "required" })
	.trim()
	.min(1, { message: "required" })
	.max(16, { message: "tooLong" })
	.brand<"CategoryName">();

/**
 * Branded type for validated category names.
 */
export type CategoryName = z.infer<typeof CategoryName>;

/**
 * Creates a validated CategoryName from a string.
 *
 * @param v - The raw string value to validate
 * @returns A branded CategoryName value
 * @throws {ZodError} When validation fails (empty or exceeds 16 chars)
 *
 * @example
 * ```typescript
 * const name = makeCategoryName("Technology");
 * ```
 */
export const makeCategoryName = (v: string): CategoryName =>
	CategoryName.parse(v);

/**
 * Zod schema for validating article titles.
 *
 * @remarks
 * Validates that the title is a non-empty string between 1 and 128 characters.
 *
 * @example
 * ```typescript
 * const title = ArticleTitle.parse("Introduction to TypeScript");
 * ```
 *
 * @see {@link makeArticleTitle} for factory function
 */
export const ArticleTitle = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.max(128, { message: "tooLong" })
	.brand<"ArticleTitle">();

/**
 * Branded type for validated article titles.
 */
export type ArticleTitle = z.infer<typeof ArticleTitle>;

/**
 * Creates a validated ArticleTitle from a string.
 *
 * @param v - The raw string value to validate
 * @returns A branded ArticleTitle value
 * @throws {ZodError} When validation fails (empty or exceeds 128 chars)
 *
 * @example
 * ```typescript
 * const title = makeArticleTitle("Introduction to TypeScript");
 * ```
 */
export const makeArticleTitle = (v: string): ArticleTitle =>
	ArticleTitle.parse(v);

/**
 * Zod schema for validating article quotes.
 *
 * @remarks
 * Validates an optional quote with maximum 512 characters.
 * Null and undefined values are allowed.
 *
 * @example
 * ```typescript
 * const quote = Quote.parse("This is a notable excerpt from the article.");
 * const empty = Quote.parse(null);
 * ```
 *
 * @see {@link makeQuote} for factory function
 */
export const Quote = z
	.string()
	.max(512, { message: "tooLong" })
	.nullable()
	.optional()
	.brand<"Quote">();

/**
 * Branded type for validated quotes.
 */
export type Quote = z.infer<typeof Quote>;

/**
 * Creates a validated Quote from a string or null/undefined.
 *
 * @param v - The raw string value, null, or undefined
 * @returns A branded Quote value
 * @throws {ZodError} When string exceeds 512 characters
 *
 * @example
 * ```typescript
 * const quote = makeQuote("Notable excerpt");
 * const noQuote = makeQuote(null);
 * ```
 */
export const makeQuote = (v: string | null | undefined): Quote =>
	Quote.parse(v);

/**
 * Zod schema for validating article URLs.
 *
 * @remarks
 * Validates that the URL is a valid HTTP or HTTPS URL.
 * Other protocols are not allowed.
 *
 * @example
 * ```typescript
 * const url = Url.parse("https://example.com/article");
 * ```
 *
 * @see {@link makeUrl} for factory function
 */
export const Url = z
	.url({ message: "invalidFormat" })
	.min(1, { message: "required" })
	.max(1024, { message: "tooLong" })
	.refine(
		(url: string) => {
			try {
				const urlObject = new URL(url);
				return (
					urlObject.protocol === "http:" || urlObject.protocol === "https:"
				);
			} catch {
				return false;
			}
		},
		{ message: "invalidFormat" },
	)
	.brand<"Url">();

/**
 * Branded type for validated URLs.
 */
export type Url = z.infer<typeof Url>;

/**
 * Creates a validated Url from a string.
 *
 * @param v - The raw URL string
 * @returns A branded Url value
 * @throws {ZodError} When URL is invalid or not HTTP/HTTPS
 *
 * @example
 * ```typescript
 * const url = makeUrl("https://example.com/article");
 * ```
 */
export const makeUrl = (v: string): Url => Url.parse(v);

/**
 * Zod schema for validating Open Graph titles.
 *
 * @remarks
 * Optional string for the OG title fetched from the article URL.
 * Null and undefined values are allowed.
 *
 * @see {@link makeOgTitle} for factory function
 */
export const OgTitle = z
	.string()
	.max(512, { message: "tooLong" })
	.nullable()
	.optional()
	.brand<"OgTitle">();

/**
 * Branded type for validated OG titles.
 */
export type OgTitle = z.infer<typeof OgTitle>;

/**
 * Creates a validated OgTitle from a string or null/undefined.
 *
 * @param v - The raw OG title string, null, or undefined
 * @returns A branded OgTitle value
 */
export const makeOgTitle = (v: string | null | undefined): OgTitle =>
	OgTitle.parse(v);

/**
 * Zod schema for validating Open Graph descriptions.
 *
 * @remarks
 * Optional string for the OG description fetched from the article URL.
 * Null and undefined values are allowed.
 *
 * @see {@link makeOgDescription} for factory function
 */
export const OgDescription = z
	.string()
	.max(1024, { message: "tooLong" })
	.nullable()
	.optional()
	.brand<"OgDescription">();

/**
 * Branded type for validated OG descriptions.
 */
export type OgDescription = z.infer<typeof OgDescription>;

/**
 * Creates a validated OgDescription from a string or null/undefined.
 *
 * @param v - The raw OG description string, null, or undefined
 * @returns A branded OgDescription value
 */
export const makeOgDescription = (
	v: string | null | undefined,
): OgDescription => OgDescription.parse(v);

/**
 * Zod schema for validating Open Graph image URLs.
 *
 * @remarks
 * Optional string for the OG image URL fetched from the article URL.
 * Null and undefined values are allowed.
 *
 * @see {@link makeOgImageUrl} for factory function
 */
export const OgImageUrl = z
	.string()
	.max(1024, { message: "tooLong" })
	.nullable()
	.optional()
	.brand<"OgImageUrl">();

/**
 * Branded type for validated OG image URLs.
 */
export type OgImageUrl = z.infer<typeof OgImageUrl>;

/**
 * Creates a validated OgImageUrl from a string or null/undefined.
 *
 * @param v - The raw OG image URL string, null, or undefined
 * @returns A branded OgImageUrl value
 */
export const makeOgImageUrl = (v: string | null | undefined): OgImageUrl =>
	OgImageUrl.parse(v);

// Entities

/**
 * Base schema containing common article fields.
 *
 * @internal
 */
const Base = z.object({
	id: Id,
	userId: UserId,
	categoryName: CategoryName,
	title: ArticleTitle,
	quote: Quote,
	url: Url,
	createdAt: CreatedAt,
	ogTitle: OgTitle,
	ogDescription: OgDescription,
	ogImageUrl: OgImageUrl,
});

/**
 * Zod schema for an unexported article.
 *
 * @remarks
 * Represents an article that has not yet been published.
 * This is the initial state of all newly created articles.
 *
 * @see {@link ExportedArticle} for the published state
 */
export const UnexportedArticle = Base.extend({ status: UnexportedStatus });

/**
 * Type for an unexported article entity.
 *
 * @remarks
 * Immutable entity representing an article pending export.
 */
export type UnexportedArticle = Readonly<z.infer<typeof UnexportedArticle>>;

/**
 * Zod schema for an exported article.
 *
 * @remarks
 * Represents an article that has been published.
 * Includes the exportedAt timestamp.
 *
 * @see {@link UnexportedArticle} for the initial state
 */
export const ExportedArticle = Base.extend(ExportedStatus.shape);

/**
 * Type for an exported article entity.
 *
 * @remarks
 * Immutable entity representing a published article.
 */
export type ExportedArticle = Readonly<z.infer<typeof ExportedArticle>>;

/**
 * Arguments for creating a new article.
 *
 * @remarks
 * Provides the required fields for article creation.
 * The id, createdAt, and status are auto-generated.
 *
 * @example
 * ```typescript
 * const args: CreateArticleArgs = {
 *   userId: makeUserId("user-123"),
 *   categoryName: makeCategoryName("Tech"),
 *   title: makeArticleTitle("Article Title"),
 *   url: makeUrl("https://example.com"),
 *   quote: makeQuote("Notable excerpt"),
 *   caller: "addArticle",
 * };
 * ```
 */
export type CreateArticleArgs = Readonly<{
	/** The user who owns the article */
	userId: UserId;
	/** The category for organizing the article */
	categoryName: CategoryName;
	/** The article title */
	title: ArticleTitle;
	/** Optional quote/excerpt from the article */
	quote?: Quote;
	/** The article URL */
	url: Url;
	/** The caller identifier for event tracking */
	caller: string;
}>;

/**
 * Return type for article creation: tuple of [entity, event].
 */
export type ArticleWithEvent = readonly [
	UnexportedArticle,
	ArticleCreatedEvent,
];

/**
 * Factory object for Article domain entity operations.
 *
 * **This is the Aggregate Root** for the Articles bounded context.
 *
 * @remarks
 * As the aggregate root, Article is the only entry point for creating and
 * managing article entities. All article-related operations must go through
 * this factory to ensure domain invariants are maintained.
 *
 * Provides immutable entity creation following DDD patterns.
 * All returned entities are frozen using Object.freeze().
 * Returns a tuple of [entity, event] for domain event dispatching.
 *
 * @example
 * ```typescript
 * // Create a new unexported article with its domain event
 * const [article, event] = articleEntity.create({
 *   userId: makeUserId("user-123"),
 *   categoryName: makeCategoryName("Tech"),
 *   title: makeArticleTitle("Article Title"),
 *   url: makeUrl("https://example.com"),
 *   caller: "addArticle",
 * });
 *
 * // Persist and dispatch event
 * await repository.create(article);
 * await eventDispatcher.dispatch(event);
 * ```
 *
 * @see {@link CreateArticleArgs} for creation parameters
 * @see {@link ArticleWithEvent} for return type
 * @see `ArticlesDomainService` for invariant validation (duplicate URL check)
 */
export const articleEntity = {
	/**
	 * Creates a new unexported article entity with its domain event.
	 *
	 * @param args - The creation arguments containing required fields
	 * @returns A tuple of [UnexportedArticle, ArticleCreatedEvent]
	 * @throws {InvalidFormatError} When validation of any field fails
	 * @throws {UnexpectedError} For unexpected errors during creation
	 */
	create: (args: CreateArticleArgs): ArticleWithEvent => {
		const { caller, ...entityArgs } = args;
		const article = createEntityWithErrorHandling(() =>
			Object.freeze({
				id: makeId(),
				status: "UNEXPORTED",
				createdAt: makeCreatedAt(),
				...entityArgs,
			}),
		);

		const event = new ArticleCreatedEvent({
			title: article.title as string,
			url: article.url as string,
			quote: (article.quote as string) ?? "",
			categoryName: article.categoryName as string,
			userId: article.userId as string,
			caller,
		});

		return [article, event] as const;
	},
};

// DTO Types

/**
 * DTO for article list display.
 *
 * @remarks
 * Contains only the fields needed for list views, with branded types.
 * Uses `categoryName` instead of nested `Category.name` for cleaner access.
 */
export type ArticleListItemDTO = Readonly<{
	id: Id;
	title: ArticleTitle;
	url: Url;
	quote: Quote;
	ogTitle: OgTitle;
	ogDescription: OgDescription;
	categoryName: CategoryName;
}>;

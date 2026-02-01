import { z } from "zod";

/**
 * Content types that can be searched.
 *
 * @remarks
 * Represents the different types of content available in the system.
 * Used to filter search results by content category.
 */
export type ContentType = "articles" | "books" | "notes";

/**
 * Base search result with common fields.
 *
 * @remarks
 * Contains fields shared across all content types.
 */
export type BaseSearchResult = Readonly<{
	/** The URL path to the content item */
	href: string;
	/** The title of the content item */
	title: string;
	/** A text snippet from the content for preview */
	snippet: string;
}>;

/**
 * Article-specific search result.
 *
 * @example
 * ```typescript
 * const articleResult: ArticleSearchResult = {
 *   href: "/articles/123",
 *   contentType: "articles",
 *   title: "Getting Started with TypeScript",
 *   snippet: "TypeScript is a typed superset of JavaScript...",
 *   url: "https://example.com/article",
 *   category: { id: "tech", name: "Technology" }
 * };
 * ```
 */
export type ArticleSearchResult = BaseSearchResult &
	Readonly<{
		/** Discriminant for articles */
		contentType: "articles";
		/** The external URL */
		url: string;
		/** The category information */
		category: { id: string; name: string };
	}>;

/**
 * Book-specific search result.
 *
 * @example
 * ```typescript
 * const bookResult: BookSearchResult = {
 *   href: "/books/456",
 *   contentType: "books",
 *   title: "Clean Code",
 *   snippet: "A handbook of agile software craftsmanship...",
 *   rating: 5,
 *   tags: ["programming", "best-practices"]
 * };
 * ```
 */
export type BookSearchResult = BaseSearchResult &
	Readonly<{
		/** Discriminant for books */
		contentType: "books";
		/** The user rating */
		rating: number | null;
		/** Associated tags */
		tags: string[];
	}>;

/**
 * Note-specific search result.
 *
 * @example
 * ```typescript
 * const noteResult: NoteSearchResult = {
 *   href: "/notes/789",
 *   contentType: "notes",
 *   title: "Meeting Notes",
 *   snippet: "Discussion about project timeline..."
 * };
 * ```
 */
export type NoteSearchResult = BaseSearchResult &
	Readonly<{
		/** Discriminant for notes */
		contentType: "notes";
	}>;

/**
 * A single search result item (discriminated union).
 *
 * @remarks
 * Represents a matched item from a search query.
 * Use type guards or contentType checks to access domain-specific fields.
 */
export type SearchResult =
	| ArticleSearchResult
	| BookSearchResult
	| NoteSearchResult;

/**
 * Type guard for article search results.
 */
export function isArticleSearchResult(
	result: SearchResult,
): result is ArticleSearchResult {
	return result.contentType === "articles";
}

/**
 * Type guard for book search results.
 */
export function isBookSearchResult(
	result: SearchResult,
): result is BookSearchResult {
	return result.contentType === "books";
}

/**
 * Type guard for note search results.
 */
export function isNoteSearchResult(
	result: SearchResult,
): result is NoteSearchResult {
	return result.contentType === "notes";
}

/**
 * Zod schema for validating search query parameters.
 *
 * @remarks
 * Validates and sanitizes search input to prevent DoS attacks and invalid data.
 * - query: 1-256 characters
 * - contentTypes: optional array of valid content types
 * - limit: 1-100, defaults to 20
 */
export const searchQuerySchema = z.object({
	query: z
		.string()
		.min(1, { message: "required" })
		.max(256, { message: "tooLong" }),
	contentTypes: z.array(z.enum(["articles", "books", "notes"])).optional(),
	limit: z
		.number()
		.int()
		.min(1, { message: "minimum" })
		.max(100, { message: "maximum" })
		.optional()
		.default(20),
});

/**
 * Search query parameters.
 *
 * @remarks
 * Defines the parameters for executing a search across content types.
 *
 * @example
 * ```typescript
 * const query: SearchQuery = {
 *   query: "typescript",
 *   contentTypes: ["articles", "books"],
 *   limit: 10
 * };
 * ```
 */
export type SearchQuery = z.infer<typeof searchQuerySchema>;

/**
 * Search results grouped by content type.
 *
 * @remarks
 * Groups search results by their content type, including
 * the total count of matches for that type.
 */
export type SearchResultGroup = {
	/** The content type for this group */
	contentType: ContentType;
	/** The search results in this group */
	results: SearchResult[];
	/** Total number of matches for this content type */
	totalCount: number;
};

/**
 * Unified search results across all content types.
 *
 * @remarks
 * Contains both a flat list of all results and grouped results
 * by content type, along with the original query and total count.
 *
 * @example
 * ```typescript
 * const results: UnifiedSearchResults = {
 *   query: "typescript",
 *   totalCount: 15,
 *   results: [...], // All results in relevance order
 *   groups: [
 *     { contentType: "articles", results: [...], totalCount: 8 },
 *     { contentType: "books", results: [...], totalCount: 5 },
 *     { contentType: "notes", results: [...], totalCount: 2 }
 *   ]
 * };
 * ```
 */
export type UnifiedSearchResults = {
	/** Flat list of all search results */
	results: SearchResult[];
	/** Results grouped by content type */
	groups: SearchResultGroup[];
	/** Total number of results across all types */
	totalCount: number;
	/** The original search query */
	query: string;
};

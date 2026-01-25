/**
 * Content types that can be searched.
 *
 * @remarks
 * Represents the different types of content available in the system.
 * Used to filter search results by content category.
 */
export type ContentType = "articles" | "books" | "notes";

/**
 * A single search result item.
 *
 * @remarks
 * Represents a matched item from a search query, containing
 * common fields and optional content-type-specific fields.
 *
 * @example
 * ```typescript
 * const articleResult: SearchResult = {
 *   href: "/articles/123",
 *   contentType: "articles",
 *   title: "Getting Started with TypeScript",
 *   snippet: "TypeScript is a typed superset of JavaScript...",
 *   url: "https://example.com/article",
 *   category: { id: "tech", name: "Technology" }
 * };
 *
 * const bookResult: SearchResult = {
 *   href: "/books/456",
 *   contentType: "books",
 *   title: "Clean Code",
 *   snippet: "A handbook of agile software craftsmanship...",
 *   rating: 5,
 *   tags: ["programming", "best-practices"]
 * };
 * ```
 */
export type SearchResult = {
	/** The URL path to the content item */
	href: string;
	/** The type of content this result represents */
	contentType: ContentType;
	/** The title of the content item */
	title: string;
	/** A text snippet from the content for preview */
	snippet: string;
	/** The external URL (articles only) */
	url?: string;
	/** The user rating (books only) */
	rating?: number | null;
	/** Associated tags (books only) */
	tags?: string[];
	/** The category information (articles only) */
	category?: { id: string; name: string };
};

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
export type SearchQuery = {
	/** The search term to match against content */
	query: string;
	/** Optional filter to limit search to specific content types */
	contentTypes?: ContentType[];
	/** Maximum number of results to return */
	limit?: number;
};

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

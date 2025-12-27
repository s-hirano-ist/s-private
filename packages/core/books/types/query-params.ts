import type { CacheStrategy } from "./cache-strategy.js";
import type { SortOrder } from "./sort-order.js";

/**
 * Available fields for sorting book queries.
 *
 * @remarks
 * All fields correspond to Book entity properties.
 * Used with {@link BooksOrderBy} to specify sort criteria.
 */
export type BooksOrderByField =
	| "id"
	| "ISBN"
	| "title"
	| "googleTitle"
	| "googleSubTitle"
	| "googleAuthors"
	| "googleDescription"
	| "googleImgSrc"
	| "googleHref"
	| "markdown"
	| "rating"
	| "tags"
	| "status"
	| "createdAt"
	| "updatedAt"
	| "exportedAt";

/**
 * Sort configuration for book queries.
 *
 * @remarks
 * Maps field names to sort directions.
 * Typically only one field should be specified at a time.
 *
 * @example
 * ```typescript
 * const orderBy: BooksOrderBy = { createdAt: "desc" };
 * ```
 *
 * @see {@link BooksOrderByField} for available fields
 * @see {@link SortOrder} for sort directions
 */
export type BooksOrderBy = {
	[K in BooksOrderByField]?: SortOrder;
};

/**
 * Parameters for paginated book queries.
 *
 * @example
 * ```typescript
 * const params: BooksFindManyParams = {
 *   orderBy: { createdAt: "desc" },
 *   take: 20,
 *   skip: 0,
 *   cacheStrategy: { ttl: 60, tags: ["books"] },
 * };
 * ```
 *
 * @see {@link BooksOrderBy} for sorting options
 * @see {@link CacheStrategy} for caching configuration
 */
export type BooksFindManyParams = {
	/** Sort configuration */
	orderBy?: BooksOrderBy;
	/** Maximum number of results to return */
	take?: number;
	/** Number of results to skip (for pagination) */
	skip?: number;
	/** Caching configuration for the query */
	cacheStrategy?: CacheStrategy;
};

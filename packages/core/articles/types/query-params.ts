import type { CacheStrategy } from "./cache-strategy.js";
import type { SortOrder } from "./sort-order.js";

/**
 * Available fields for sorting article queries.
 *
 * @remarks
 * All fields correspond to Article entity properties.
 * Used with {@link ArticleOrderBy} to specify sort criteria.
 */
export type ArticleOrderByField =
	| "id"
	| "title"
	| "url"
	| "quote"
	| "ogImageUrl"
	| "ogTitle"
	| "ogDescription"
	| "status"
	| "createdAt"
	| "updatedAt"
	| "exportedAt";

/**
 * Available fields for sorting category queries.
 *
 * @remarks
 * Used with {@link CategoryOrderBy} to specify sort criteria.
 */
export type CategoryOrderByField = "id" | "name" | "createdAt" | "updatedAt";

/**
 * Sort configuration for article queries.
 *
 * @remarks
 * Maps field names to sort directions.
 * Typically only one field should be specified at a time.
 *
 * @example
 * ```typescript
 * const orderBy: ArticleOrderBy = { createdAt: "desc" };
 * ```
 *
 * @see {@link ArticleOrderByField} for available fields
 * @see {@link SortOrder} for sort directions
 */
export type ArticleOrderBy = {
	[K in ArticleOrderByField]?: SortOrder;
};

/**
 * Sort configuration for category queries.
 *
 * @remarks
 * Maps field names to sort directions.
 *
 * @example
 * ```typescript
 * const orderBy: CategoryOrderBy = { name: "asc" };
 * ```
 *
 * @see {@link CategoryOrderByField} for available fields
 * @see {@link SortOrder} for sort directions
 */
export type CategoryOrderBy = {
	[K in CategoryOrderByField]?: SortOrder;
};

/**
 * Parameters for paginated article queries.
 *
 * @example
 * ```typescript
 * const params: ArticlesFindManyParams = {
 *   orderBy: { createdAt: "desc" },
 *   take: 20,
 *   skip: 0,
 *   cacheStrategy: { ttl: 60, tags: ["articles"] },
 * };
 * ```
 *
 * @see {@link ArticleOrderBy} for sorting options
 * @see {@link CacheStrategy} for caching configuration
 */
export type ArticlesFindManyParams = {
	/** Sort configuration */
	orderBy?: ArticleOrderBy;
	/** Maximum number of results to return */
	take?: number;
	/** Number of results to skip (for pagination) */
	skip?: number;
	/** Caching configuration for the query */
	cacheStrategy?: CacheStrategy;
};

/**
 * Parameters for paginated category queries.
 *
 * @example
 * ```typescript
 * const params: CategoryFindManyParams = {
 *   orderBy: { name: "asc" },
 *   take: 50,
 *   skip: 0,
 * };
 * ```
 *
 * @see {@link CategoryOrderBy} for sorting options
 */
export type CategoryFindManyParams = {
	/** Sort configuration */
	orderBy?: CategoryOrderBy;
	/** Maximum number of results to return */
	take?: number;
	/** Number of results to skip (for pagination) */
	skip?: number;
};

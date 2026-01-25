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

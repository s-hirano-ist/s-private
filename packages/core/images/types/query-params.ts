import type { CacheStrategy } from "./cache-strategy";
import type { SortOrder } from "./sort-order";

/**
 * Available fields for sorting image queries.
 *
 * @remarks
 * All fields correspond to Image entity properties.
 * Used with {@link ImagesOrderBy} to specify sort criteria.
 */
export type ImagesOrderByField =
	| "id"
	| "path"
	| "contentType"
	| "fileSize"
	| "width"
	| "height"
	| "tags"
	| "description"
	| "status"
	| "createdAt"
	| "updatedAt"
	| "exportedAt";

/**
 * Sort configuration for image queries.
 *
 * @remarks
 * Maps field names to sort directions.
 * Typically only one field should be specified at a time.
 *
 * @example
 * ```typescript
 * const orderBy: ImagesOrderBy = { createdAt: "desc" };
 * ```
 *
 * @see {@link ImagesOrderByField} for available fields
 * @see {@link SortOrder} for sort directions
 */
export type ImagesOrderBy = {
	[K in ImagesOrderByField]?: SortOrder;
};

/**
 * Parameters for paginated image queries.
 *
 * @example
 * ```typescript
 * const params: ImagesFindManyParams = {
 *   orderBy: { createdAt: "desc" },
 *   take: 20,
 *   skip: 0,
 *   cacheStrategy: { ttl: 60, tags: ["images"] },
 * };
 * ```
 *
 * @see {@link ImagesOrderBy} for sorting options
 * @see {@link CacheStrategy} for caching configuration
 */
export type ImagesFindManyParams = {
	/** Sort configuration */
	orderBy?: ImagesOrderBy;
	/** Maximum number of results to return */
	take?: number;
	/** Number of results to skip (for pagination) */
	skip?: number;
	/** Caching configuration for the query */
	cacheStrategy?: CacheStrategy;
};

import type { SortOrder } from "./sort-order.js";

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

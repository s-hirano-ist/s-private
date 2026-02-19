import type { SortOrder } from "./sort-order.ts";

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

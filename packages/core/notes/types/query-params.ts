import type { SortOrder } from "./sort-order";

/**
 * Available fields for sorting note queries.
 *
 * @remarks
 * All fields correspond to Note entity properties.
 * Used with {@link NotesOrderBy} to specify sort criteria.
 */
export type NotesOrderByField =
	| "id"
	| "title"
	| "markdown"
	| "status"
	| "createdAt"
	| "updatedAt"
	| "exportedAt";

/**
 * Sort configuration for note queries.
 *
 * @remarks
 * Maps field names to sort directions.
 * Typically only one field should be specified at a time.
 *
 * @example
 * ```typescript
 * const orderBy: NotesOrderBy = { createdAt: "desc" };
 * ```
 *
 * @see {@link NotesOrderByField} for available fields
 * @see {@link SortOrder} for sort directions
 */
export type NotesOrderBy = {
	[K in NotesOrderByField]?: SortOrder;
};

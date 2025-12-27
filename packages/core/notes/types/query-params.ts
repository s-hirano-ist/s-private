import type { CacheStrategy } from "./cache-strategy.js";
import type { SortOrder } from "./sort-order.js";

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

/**
 * Parameters for paginated note queries.
 *
 * @example
 * ```typescript
 * const params: NotesFindManyParams = {
 *   orderBy: { createdAt: "desc" },
 *   take: 20,
 *   skip: 0,
 *   cacheStrategy: { ttl: 60, tags: ["notes"] },
 * };
 * ```
 *
 * @see {@link NotesOrderBy} for sorting options
 * @see {@link CacheStrategy} for caching configuration
 */
export type NotesFindManyParams = {
	/** Sort configuration */
	orderBy?: NotesOrderBy;
	/** Maximum number of results to return */
	take?: number;
	/** Number of results to skip (for pagination) */
	skip?: number;
	/** Caching configuration for the query */
	cacheStrategy?: CacheStrategy;
};

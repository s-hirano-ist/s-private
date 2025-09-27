import type { CacheStrategy } from "./cache-strategy";
import type { SortOrder } from "./sort-order";

type NotesOrderByField =
	| "id"
	| "title"
	| "markdown"
	| "status"
	| "createdAt"
	| "updatedAt"
	| "exportedAt";

type NotesOrderBy = {
	[K in NotesOrderByField]?: SortOrder;
};

export type NotesFindManyParams = {
	orderBy?: NotesOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

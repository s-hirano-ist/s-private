import type { CacheStrategy } from "./cache-strategy";
import type { SortOrder } from "./sort-order";

export type ContentsOrderByField =
	| "id"
	| "title"
	| "markdown"
	| "status"
	| "createdAt"
	| "updatedAt"
	| "exportedAt";

export type ContentsOrderBy = {
	[K in ContentsOrderByField]?: SortOrder;
};

export type ContentsFindManyParams = {
	orderBy?: ContentsOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

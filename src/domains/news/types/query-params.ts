import type { CacheStrategy } from "./cache-strategy";
import type { SortOrder } from "./sort-order";

export type NewsOrderByField =
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

export type CategoryOrderByField = "id" | "name" | "createdAt" | "updatedAt";

export type NewsOrderBy = {
	[K in NewsOrderByField]?: SortOrder;
};

export type CategoryOrderBy = {
	[K in CategoryOrderByField]?: SortOrder;
};

export type NewsFindManyParams = {
	orderBy?: NewsOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

export type CategoryFindManyParams = {
	orderBy?: CategoryOrderBy;
	take?: number;
	skip?: number;
};

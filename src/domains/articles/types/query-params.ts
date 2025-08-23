import type { CacheStrategy } from "./cache-strategy";
import type { SortOrder } from "./sort-order";

type ArticleOrderByField =
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

type CategoryOrderByField = "id" | "name" | "createdAt" | "updatedAt";

type ArticleOrderBy = {
	[K in ArticleOrderByField]?: SortOrder;
};

type CategoryOrderBy = {
	[K in CategoryOrderByField]?: SortOrder;
};

export type ArticlesFindManyParams = {
	orderBy?: ArticleOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

export type CategoryFindManyParams = {
	orderBy?: CategoryOrderBy;
	take?: number;
	skip?: number;
};

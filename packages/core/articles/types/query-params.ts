import type { CacheStrategy } from "./cache-strategy";
import type { SortOrder } from "./sort-order";

/** 記事のソートフィールド */
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

/** カテゴリのソートフィールド */
export type CategoryOrderByField = "id" | "name" | "createdAt" | "updatedAt";

/** 記事のソート条件 */
export type ArticleOrderBy = {
	[K in ArticleOrderByField]?: SortOrder;
};

/** カテゴリのソート条件 */
export type CategoryOrderBy = {
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

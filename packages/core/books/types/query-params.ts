import type { CacheStrategy } from "./cache-strategy";
import type { SortOrder } from "./sort-order";

/** 書籍のソートフィールド */
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

/** 書籍のソート条件 */
export type BooksOrderBy = {
	[K in BooksOrderByField]?: SortOrder;
};

export type BooksFindManyParams = {
	orderBy?: BooksOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

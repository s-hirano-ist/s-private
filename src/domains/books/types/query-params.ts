import type { CacheStrategy } from "./cache-strategy";
import type { SortOrder } from "./sort-order";

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

export type BooksOrderBy = {
	[K in BooksOrderByField]?: SortOrder;
};

export type BooksFindManyParams = {
	orderBy?: BooksOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

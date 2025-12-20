import type { CacheStrategy } from "./cache-strategy";
import type { SortOrder } from "./sort-order";

/** 画像のソートフィールド */
export type ImagesOrderByField =
	| "id"
	| "path"
	| "contentType"
	| "fileSize"
	| "width"
	| "height"
	| "tags"
	| "description"
	| "status"
	| "createdAt"
	| "updatedAt"
	| "exportedAt";

/** 画像のソート条件 */
export type ImagesOrderBy = {
	[K in ImagesOrderByField]?: SortOrder;
};

export type ImagesFindManyParams = {
	orderBy?: ImagesOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

import type { CacheStrategy } from "./cache-strategy";
import type { SortOrder } from "./sort-order";

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

export type ImagesOrderBy = {
	[K in ImagesOrderByField]?: SortOrder;
};

export type ImagesFindManyParams = {
	orderBy?: ImagesOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

import type { Status, UserId } from "../common/entities/common-entity";
import type { Image, Path } from "./entities/images-entity";

// Custom types to avoid Prisma dependency in domain layer
export type SortOrder = "asc" | "desc";

export type CacheStrategy = {
	ttl?: number;
	swr?: number;
	tags?: string[];
};

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

export type IImagesCommandRepository = {
	create(data: Image): Promise<void>;
	uploadToStorage(
		path: Path,
		buffer: Buffer,
		isThumbnail: boolean,
	): Promise<void>;
	deleteById(id: string, userId: string, status: Status): Promise<void>;
};

export type ImagesFindManyParams = {
	orderBy?: ImagesOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

export type IImagesQueryRepository = {
	findByPath(path: Path, userId: UserId): Promise<{} | null>;
	findMany(
		userId: UserId,
		status: Status,
		params?: ImagesFindManyParams,
	): Promise<
		{ id: string; path: string; height: number | null; width: number | null }[]
	>;
	count(userId: UserId, status: Status): Promise<number>;
	getFromStorage(
		path: string,
		isThumbnail: boolean,
	): Promise<NodeJS.ReadableStream>;
};

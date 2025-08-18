import type { Status } from "../common/entities/common-entity";
import type {
	ImagesFormSchema,
	ImagesQueryData,
} from "./entities/images-entity";

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
	create(data: ImagesFormSchema): Promise<void>;
	uploadToStorage(
		path: string,
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
	findByPath(path: string, userId: string): Promise<ImagesQueryData | null>;
	findMany(
		userId: string,
		status: Status,
		params?: ImagesFindManyParams,
	): Promise<ImagesQueryData[]>;
	count(userId: string, status: Status): Promise<number>;
	getFromStorage(
		path: string,
		isThumbnail: boolean,
	): Promise<NodeJS.ReadableStream>;
};

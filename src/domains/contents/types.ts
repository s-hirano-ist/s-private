import type { Status } from "../common/entities/common-entity";
import type { Content } from "./entities/contents-entity";

// Custom types to avoid Prisma dependency in domain layer
export type SortOrder = "asc" | "desc";

export type CacheStrategy = {
	ttl?: number;
	swr?: number;
	tags?: string[];
};

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

export type IContentsCommandRepository = {
	create(data: Content): Promise<void>;
	deleteById(id: string, userId: string, status: Status): Promise<void>;
};

export type IContentsQueryRepository = {
	findByTitle(
		title: string,
		userId: string,
	): Promise<{ id: string; title: string; markdown: string } | null>;
	findMany(
		userId: string,
		status: Status,
		params: ContentsFindManyParams,
	): Promise<Array<{ id: string; title: string }>>;
	count(userId: string, status: Status): Promise<number>;
};

export type ContentsFindManyParams = {
	orderBy?: ContentsOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

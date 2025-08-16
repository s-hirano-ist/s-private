import type { Status } from "../common/entities/common-entity";
import type {
	ContentsFormSchema,
	ContentsQueryData,
} from "./entities/contents-entity";

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
	create(data: ContentsFormSchema): Promise<void>;
	deleteById(id: string, userId: string, status: Status): Promise<void>;
};

export type IContentsQueryRepository = {
	findByTitle(title: string, userId: string): Promise<string | null>;
	findMany(
		userId: string,
		status: Status,
		params: ContentsFindManyParams,
	): Promise<ContentsQueryData[]>;
	count(userId: string, status: Status): Promise<number>;
};

export type ContentsFindManyParams = {
	orderBy?: ContentsOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

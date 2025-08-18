import type { Status } from "@/domains/common/entities/common-entity";
import type {
	CategoryQueryData,
	NewsFormSchema,
	NewsQueryData,
} from "./entities/news-entity";

// Custom types to avoid Prisma dependency in domain layer
export type SortOrder = "asc" | "desc";

export type CacheStrategy = {
	ttl?: number;
	swr?: number;
	tags?: string[];
};

export type NewsOrderByField =
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

export type CategoryOrderByField = "id" | "name" | "createdAt" | "updatedAt";

export type NewsOrderBy = {
	[K in NewsOrderByField]?: SortOrder;
};

export type CategoryOrderBy = {
	[K in CategoryOrderByField]?: SortOrder;
};

export type INewsCommandRepository = {
	create(data: NewsFormSchema): Promise<void>;
	deleteById(id: string, userId: string, status: Status): Promise<void>;
};

export type INewsQueryRepository = {
	findByUrl(url: string, userId: string): Promise<{} | null>;
	findMany(
		userId: string,
		status: Status,
		params: NewsFindManyParams,
	): Promise<NewsQueryData[]>;
	count(userId: string, status: Status): Promise<number>;
};

export type NewsFindManyParams = {
	orderBy?: NewsOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

export type ICategoryQueryRepository = {
	findMany(
		userId: string,
		params?: CategoryFindManyParams,
	): Promise<CategoryQueryData[]>;
};

export type CategoryFindManyParams = {
	orderBy?: CategoryOrderBy;
	take?: number;
	skip?: number;
};

import type { Status } from "@/domains/common/entities/common-entity";
import { NewsEntity, NewsFormSchema, NewsQueryData } from "./entities/news.entity";
import { CategoryEntity, CategoryFormSchema, CategoryQueryData } from "./entities/category.entity";

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
	create(entity: NewsEntity): Promise<void>;
	deleteById(id: string, userId: string, status: Status): Promise<void>;
};

export type INewsQueryRepository = {
	findByUrl(url: string, userId: string): Promise<NewsEntity | null>;
	findMany(
		userId: string,
		status: Status,
		params: NewsFindManyParams,
	): Promise<NewsEntity[]>;
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
	): Promise<CategoryEntity[]>;
};

export type CategoryFindManyParams = {
	orderBy?: CategoryOrderBy;
	take?: number;
	skip?: number;
};

import type {
	Id,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import type { News, Url } from "./entities/news-entity";

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
	create(data: News): Promise<void>;
	deleteById(id: Id, userId: UserId, status: Status): Promise<void>;
};

export type INewsQueryRepository = {
	findByUrl(url: Url, userId: UserId): Promise<{} | null>;
	findMany(
		userId: UserId,
		status: Status,
		params: NewsFindManyParams,
	): Promise<
		{
			id: string;
			title: string;
			url: string;
			quote: string | null;
			ogTitle: string | null;
			ogDescription: string | null;
			Category: {
				id: string;
				name: string;
			};
		}[]
	>;
	count(userId: UserId, status: Status): Promise<number>;
};

export type NewsFindManyParams = {
	orderBy?: NewsOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

export type ICategoryQueryRepository = {
	findMany(
		userId: UserId,
		params?: CategoryFindManyParams,
	): Promise<
		{
			id: string;
			name: string;
		}[]
	>;
};

export type CategoryFindManyParams = {
	orderBy?: CategoryOrderBy;
	take?: number;
	skip?: number;
};

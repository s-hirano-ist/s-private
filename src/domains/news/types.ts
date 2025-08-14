import type { PrismaCacheStrategy } from "@prisma/extension-accelerate";
import type { Status } from "@/domains/common/types";
import type { Prisma } from "@/generated";
import type { CategoryQueryData, NewsQueryData } from "./entities/news-entity";
import { NewsFormSchema } from "./entities/news-entity";

// FIXME: TODO: prisma依存の削除

// news

export type INewsCommandRepository = {
	create(data: NewsFormSchema): Promise<void>;
	deleteById(id: string, userId: string, status: Status): Promise<void>;
};

export type INewsQueryRepository = {
	findByUrl(userId: string, url: string): Promise<{} | null>;
	findMany(
		userId: string,
		status: Status,
		params: NewsFindManyParams,
	): Promise<NewsQueryData[]>;
	count(userId: string, status: Status): Promise<number>;
};

export type NewsFindManyParams = {
	orderBy?: Prisma.NewsOrderByWithRelationInput;
	take?: number;
	skip?: number;
	cacheStrategy?: PrismaCacheStrategy["cacheStrategy"];
};

// categories

export type ICategoryQueryRepository = {
	findMany(
		userId: string,
		params?: CategoryFindManyParams,
	): Promise<CategoryQueryData[]>;
};

export type CategoryFindManyParams = {
	orderBy?: Prisma.CategoriesOrderByWithRelationInput;
	take?: number;
	skip?: number;
};

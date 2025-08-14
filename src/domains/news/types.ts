import type { PrismaCacheStrategy } from "@prisma/extension-accelerate";
import type { Prisma } from "@/generated";
import type { Status } from "../../features/types";
import type {
	CategoryQuerySchema,
	NewsFormSchema,
	NewsQuerySchema,
} from "./news-schema";

// news

export type INewsCommandRepository = {
	create(data: NewsFormSchema): Promise<void>;
	deleteById(id: string, userId: string, status: Status): Promise<void>;
};

export type INewsQueryRepository = {
	findMany(
		userId: string,
		status: Status,
		params: NewsFindManyParams,
	): Promise<NewsQuerySchema[]>;
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
	): Promise<CategoryQuerySchema[]>;
};

export type CategoryFindManyParams = {
	orderBy?: Prisma.CategoriesOrderByWithRelationInput;
	take?: number;
	skip?: number;
};

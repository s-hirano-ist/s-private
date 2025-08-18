import type { Status } from "@/domains/common/entities/common-entity";
import type { ICategoryQueryRepository } from "@/domains/news/repositories/category-query-repository.interface";
import type { INewsQueryRepository } from "@/domains/news/repositories/news-query-repository.interface";
import type {
	CategoryFindManyParams,
	NewsFindManyParams,
} from "@/domains/news/types/query-params";
import prisma from "@/prisma";

class NewsQueryRepository implements INewsQueryRepository {
	findByUrl = async (url: string, userId: string) => {
		return await prisma.news.findUnique({
			where: { url_userId: { url, userId } },
			select: { url: true },
		});
	};

	findMany = async (
		userId: string,
		status: Status,
		params: NewsFindManyParams,
	) => {
		return await prisma.news.findMany({
			where: { userId, status },
			select: {
				id: true,
				title: true,
				url: true,
				quote: true,
				ogTitle: true,
				ogDescription: true,
				Category: { select: { id: true, name: true } },
			},
			...params,
		});
	};

	async count(userId: string, status: Status): Promise<number> {
		return await prisma.news.count({ where: { userId, status } });
	}
}

export const newsQueryRepository = new NewsQueryRepository();

class CategoryQueryRepository implements ICategoryQueryRepository {
	async findMany(userId: string, params?: CategoryFindManyParams) {
		return await prisma.categories.findMany({
			where: { userId },
			select: { id: true, name: true },
			...params,
		});
	}
}

export const categoryQueryRepository = new CategoryQueryRepository();

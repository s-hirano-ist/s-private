import type { IArticlesQueryRepository } from "@/domains/articles/repositories/articles-query-repository.interface";
import type { ICategoryQueryRepository } from "@/domains/articles/repositories/category-query-repository.interface";
import type {
	ArticlesFindManyParams,
	CategoryFindManyParams,
} from "@/domains/articles/types/query-params";
import type { Status } from "@/domains/common/entities/common-entity";
import prisma from "@/prisma";

class ArticlesQueryRepository implements IArticlesQueryRepository {
	findByUrl = async (url: string, userId: string) => {
		const data = await prisma.news.findUnique({
			where: { url_userId: { url, userId } },
			select: { url: true },
		});
		return data;
	};

	findMany = async (
		userId: string,
		status: Status,
		params: ArticlesFindManyParams,
	) => {
		const data = await prisma.news.findMany({
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
		return data;
	};

	async count(userId: string, status: Status): Promise<number> {
		const data = await prisma.news.count({ where: { userId, status } });
		return data;
	}
}

export const articlesQueryRepository = new ArticlesQueryRepository();

class CategoryQueryRepository implements ICategoryQueryRepository {
	async findMany(userId: string, params?: CategoryFindManyParams) {
		const data = await prisma.categories.findMany({
			where: { userId },
			select: { id: true, name: true },
			...params,
		});
		return data;
	}
}

export const categoryQueryRepository = new CategoryQueryRepository();

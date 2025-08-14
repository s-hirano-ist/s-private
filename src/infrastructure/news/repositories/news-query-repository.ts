import type {
	CategoryQuerySchema,
	NewsQuerySchema,
} from "@/domains/news/news-schema";
import type {
	CategoryFindManyParams,
	ICategoryQueryRepository,
	INewsQueryRepository,
	NewsFindManyParams,
} from "@/domains/news/types";
import type { Status } from "@/generated";
import prisma from "@/prisma";

class NewsQueryRepository implements INewsQueryRepository {
	findMany = async (
		userId: string,
		status: Status,
		params: NewsFindManyParams,
	): Promise<NewsQuerySchema[]> => {
		const response = await prisma.news.findMany({
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
		return response.map((d) => ({
			categoryName: d.Category.name,
			categoryId: d.Category.id,
			id: d.id,
			quote: d.quote,
			title: d.title,
			url: d.url,
			ogTitle: d.ogTitle,
			ogDescription: d.ogDescription,
		}));
	};

	async count(userId: string, status: Status): Promise<number> {
		return await prisma.news.count({ where: { userId, status } });
	}
}

export const newsQueryRepository = new NewsQueryRepository();

class CategoryQueryRepository implements ICategoryQueryRepository {
	async findMany(
		userId: string,
		params?: CategoryFindManyParams,
	): Promise<CategoryQuerySchema[]> {
		const response = await prisma.categories.findMany({
			where: { userId },
			select: { id: true, name: true },
			...params,
		});
		return response.map((d) => ({
			categoryId: d.id,
			categoryName: d.name,
		}));
	}
}

export const categoryQueryRepository = new CategoryQueryRepository();

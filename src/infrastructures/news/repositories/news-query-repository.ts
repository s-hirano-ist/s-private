import type { Status } from "@/domains/common/entities/common-entity";
import {
	type CategoryQueryData,
	categoryQueryData,
	type NewsQueryData,
	newsQueryData,
} from "@/domains/news/entities/news-entity";
import type {
	CategoryFindManyParams,
	ICategoryQueryRepository,
	INewsQueryRepository,
	NewsFindManyParams,
} from "@/domains/news/types";
import prisma from "@/prisma";

class NewsQueryRepository implements INewsQueryRepository {
	findByUrl = async (url: string, userId: string): Promise<{} | null> => {
		return await prisma.news.findUnique({
			where: { url_userId: { url, userId } },
			select: { url: true },
		});
	};

	findMany = async (
		userId: string,
		status: Status,
		params: NewsFindManyParams,
	): Promise<NewsQueryData[]> => {
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
		return response.map((d) =>
			newsQueryData.parse({
				category: categoryQueryData.parse({
					name: d.Category.name,
					id: d.Category.id,
				}),
				id: d.id,
				quote: d.quote,
				title: d.title,
				url: d.url,
				ogTitle: d.ogTitle,
				ogDescription: d.ogDescription,
			}),
		);
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
	): Promise<CategoryQueryData[]> {
		const response = await prisma.categories.findMany({
			where: { userId },
			select: { id: true, name: true },
			...params,
		});
		return response.map((category) => categoryQueryData.parse(category));
	}
}

export const categoryQueryRepository = new CategoryQueryRepository();

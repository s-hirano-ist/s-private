import type { Status } from "@/domains/common/entities/common-entity";
import { NewsEntity } from "@/domains/news/entities/news.entity";
import { CategoryEntity } from "@/domains/news/entities/category.entity";
import type {
	CategoryFindManyParams,
	ICategoryQueryRepository,
	INewsQueryRepository,
	NewsFindManyParams,
} from "@/domains/news/types";
import prisma from "@/prisma";

class NewsQueryRepository implements INewsQueryRepository {
	findByUrl = async (url: string, userId: string): Promise<NewsEntity | null> => {
		const result = await prisma.news.findUnique({
			where: { url_userId: { url, userId } },
			include: { Category: true },
		});
		
		if (!result) return null;
		
		return NewsEntity.reconstitute({
			id: result.id,
			title: result.title,
			url: result.url,
			quote: result.quote,
			userId: result.userId,
			status: result.status,
			ogTitle: result.ogTitle,
			ogDescription: result.ogDescription,
			category: {
				id: result.Category.id,
				name: result.Category.name,
				userId: result.Category.userId,
			},
		});
	};

	findMany = async (
		userId: string,
		status: Status,
		params: NewsFindManyParams,
	): Promise<NewsEntity[]> => {
		const response = await prisma.news.findMany({
			where: { userId, status },
			include: { Category: true },
			...params,
		});
		
		return response.map((result) => NewsEntity.reconstitute({
			id: result.id,
			title: result.title,
			url: result.url,
			quote: result.quote,
			userId: result.userId,
			status: result.status,
			ogTitle: result.ogTitle,
			ogDescription: result.ogDescription,
			category: {
				id: result.Category.id,
				name: result.Category.name,
				userId: result.Category.userId,
			},
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
	): Promise<CategoryEntity[]> {
		const response = await prisma.categories.findMany({
			where: { userId },
			...params,
		});
		
		return response.map(result => CategoryEntity.reconstitute({
			id: result.id,
			name: result.name,
			userId: result.userId,
		}));
	}
}

export const categoryQueryRepository = new CategoryQueryRepository();

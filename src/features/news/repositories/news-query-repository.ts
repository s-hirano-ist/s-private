import type { Prisma, Status } from "@/generated";
import prisma from "@/prisma";

type INewsQueryRepository = {
	findById(
		id: number,
		userId: string,
		status: Status,
	): Promise<NewsWithCategory | null>;
	findMany(
		userId: string,
		status: Status,
		params: NewsFindManyParams,
	): Promise<NewsWithCategory[]>;
	count(userId: string, status: Status): Promise<number>;
};

type NewsWithCategory = {
	id: number;
	title: string;
	url: string;
	quote: string | null;
	ogTitle: string | null;
	ogDescription: string | null;
	Category: { name: string };
};

type NewsFindManyParams = {
	orderBy?: Prisma.NewsOrderByWithRelationInput;
	take?: number;
	skip?: number;
};

class NewsQueryRepository implements INewsQueryRepository {
	async findById(
		id: number,
		userId: string,
		status: Status,
	): Promise<NewsWithCategory | null> {
		return await prisma.news.findUnique({
			where: { id, userId, status },
			include: { Category: true },
		});
	}

	findMany = async (
		userId: string,
		status: Status,
		params: NewsFindManyParams,
	): Promise<NewsWithCategory[]> => {
		return await prisma.news.findMany({
			where: { userId, status },
			select: {
				id: true,
				title: true,
				url: true,
				quote: true,
				ogTitle: true,
				ogDescription: true,
				Category: { select: { name: true } },
			},
			...params,
			cacheStrategy: { ttl: 400, swr: 40, tags: ["news"] },
		});
	};

	count = async (userId: string, status: Status): Promise<number> => {
		return await prisma.news.count({ where: { userId, status } });
	};
}

export const newsQueryRepository = new NewsQueryRepository();

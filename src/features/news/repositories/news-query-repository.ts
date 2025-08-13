import { PrismaCacheStrategy } from "@prisma/extension-accelerate";
import type { Prisma, Status } from "@/generated";
import prisma from "@/prisma";

type INewsQueryRepository = {
	findById(id: string, userId: string, status: Status): Promise<News | null>;
	findMany(
		userId: string,
		status: Status,
		params: NewsFindManyParams,
	): Promise<News[]>;
	count(userId: string, status: Status): Promise<number>;
};

type News = {
	id: string;
	title: string;
	url: string;
	quote: string | null;
	ogTitle: string | null;
	ogDescription: string | null;
	Category: { id: number; name: string };
};

type NewsFindManyParams = {
	orderBy?: Prisma.NewsOrderByWithRelationInput;
	take?: number;
	skip?: number;
	cacheStrategy?: PrismaCacheStrategy["cacheStrategy"];
};

class NewsQueryRepository implements INewsQueryRepository {
	async findById(
		id: string,
		userId: string,
		status: Status,
	): Promise<News | null> {
		return await prisma.news.findUnique({
			where: { id, userId, status },
			include: { Category: true },
		});
	}

	findMany = async (
		userId: string,
		status: Status,
		params: NewsFindManyParams,
	): Promise<News[]> => {
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

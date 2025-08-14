import type { Status } from "@/generated";
import prisma from "@/prisma";

type INewsCommandRepository = {
	create(data: NewsCreateInput): Promise<News>;
	deleteById(id: string, userId: string, status: Status): Promise<void>;
};

type NewsCreateInput = {
	title: string;
	url: string;
	quote: string | null;
	categoryId: number;
	userId: string;
};

type News = {
	id: string;
	title: string;
	url: string;
	quote: string | null;
	ogTitle: string | null;
	ogDescription: string | null;
	Category: { name: string };
};

class NewsCommandRepository implements INewsCommandRepository {
	async create(data: NewsCreateInput): Promise<News> {
		return await prisma.news.create({
			data,
			include: { Category: true },
		});
	}

	async deleteById(id: string, userId: string, status: Status): Promise<void> {
		await prisma.news.delete({
			where: { id, userId, status },
		});
	}
}

export const newsCommandRepository = new NewsCommandRepository();

import { PAGE_SIZE } from "@/constants";
import type { Prisma, Status } from "@/generated";
import prisma from "@/prisma";

export type INewsRepository = {
	create(data: NewsCreateInput): Promise<NewsWithCategory>;
	findById(id: number): Promise<NewsWithCategory | null>;
	findByIdAndUserId(
		id: number,
		userId: string,
	): Promise<NewsWithCategory | null>;
	findMany(params?: NewsFindManyParams): Promise<NewsWithCategory[]>;
	updateStatus(id: number, status: Status): Promise<NewsWithCategory>;
	updateManyStatus(
		userId: string,
		fromStatus: Status,
		toStatus: Status,
	): Promise<number>;
	delete(id: number): Promise<void>;
	deleteByIdAndUserId(id: number, userId: string): Promise<void>;
	findByStatus(status: Status, userId: string): Promise<NewsWithCategory[]>;
	findByStatusAndUserIdWithCategory(status: Status, userId: string): Promise<NewsWithCategory[]>;
	transaction<T>(fn: () => Promise<T>): Promise<T>;
	findExportedMany(page: number): Promise<NewsWithCategory[]>;
	count(): Promise<number>;
};

type NewsCreateInput = {
	title: string;
	url: string;
	quote: string | null;
	categoryId: number;
	userId: string;
};

type NewsWithCategory = {
	id: number;
	title: string;
	url: string;
	quote: string | null;
	status: Status;
	categoryId: number;
	userId: string;
	createdAt: Date;
	updatedAt: Date;
	ogImageUrl: string | null;
	ogTitle: string | null;
	ogDescription: string | null;
	Category: {
		id: number;
		name: string;
	};
};

type NewsFindManyParams = {
	where?: Prisma.NewsWhereInput;
	orderBy?: Prisma.NewsOrderByWithRelationInput;
	take?: number;
	skip?: number;
};

export class NewsRepository implements INewsRepository {
	async create(data: NewsCreateInput): Promise<NewsWithCategory> {
		return await prisma.news.create({
			data,
			include: { Category: true },
		});
	}

	async findById(id: number): Promise<NewsWithCategory | null> {
		return await prisma.news.findUnique({
			where: { id },
			include: { Category: true },
		});
	}

	async findByIdAndUserId(
		id: number,
		userId: string,
	): Promise<NewsWithCategory | null> {
		return await prisma.news.findUnique({
			where: { id, userId },
			include: { Category: true },
		});
	}

	async findMany(params?: NewsFindManyParams): Promise<NewsWithCategory[]> {
		return await prisma.news.findMany({
			...params,
			include: { Category: true },
		});
	}

	async updateStatus(id: number, status: Status): Promise<NewsWithCategory> {
		return await prisma.news.update({
			where: { id },
			data: { status },
			include: { Category: true },
		});
	}

	async updateManyStatus(
		userId: string,
		fromStatus: Status,
		toStatus: Status,
	): Promise<number> {
		const result = await prisma.news.updateMany({
			where: { status: fromStatus, userId },
			data: { status: toStatus },
		});
		return result.count;
	}

	async delete(id: number): Promise<void> {
		await prisma.news.delete({
			where: { id },
		});
	}

	async deleteByIdAndUserId(id: number, userId: string): Promise<void> {
		await prisma.news.delete({
			where: { id, userId },
		});
	}

	async findByStatus(
		status: Status,
		userId: string,
	): Promise<NewsWithCategory[]> {
		return await prisma.news.findMany({
			where: { status, userId },
			include: {
				Category: true,
			},
			orderBy: { createdAt: "desc" },
		});
	}

	async findByStatusAndUserIdWithCategory(
		status: Status,
		userId: string,
	): Promise<NewsWithCategory[]> {
		return await prisma.news.findMany({
			where: { status, userId },
			select: {
				id: true,
				title: true,
				quote: true,
				url: true,
				status: true,
				categoryId: true,
				userId: true,
				createdAt: true,
				updatedAt: true,
				ogImageUrl: true,
				ogTitle: true,
				ogDescription: true,
				Category: { select: { id: true, name: true } },
			},
			orderBy: { id: "desc" },
		});
	}

	async transaction<T>(fn: () => Promise<T>): Promise<T> {
		return await prisma.$transaction(fn);
	}

	findExportedMany = async (page: number): Promise<NewsWithCategory[]> => {
		return await prisma.news.findMany({
			select: {
				id: true,
				title: true,
				url: true,
				quote: true,
				ogImageUrl: true,
				ogTitle: true,
				ogDescription: true,
				status: true,
				categoryId: true,
				userId: true,
				createdAt: true,
				updatedAt: true,
				Category: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
			cacheStrategy: { ttl: 400, swr: 40, tags: ["news"] },
		});
	};

	count = async (): Promise<number> => {
		return await prisma.news.count({});
	};
}

export const newsRepository = new NewsRepository();

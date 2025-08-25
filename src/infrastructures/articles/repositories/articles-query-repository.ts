import type { IArticlesQueryRepository } from "@/domains/articles/repositories/articles-query-repository.interface";
import type { ICategoryQueryRepository } from "@/domains/articles/repositories/category-query-repository.interface";
import type {
	ArticlesFindManyParams,
	CategoryFindManyParams,
} from "@/domains/articles/types/query-params";
import type { Status, UserId } from "@/domains/common/entities/common-entity";
import type { Prisma } from "@/generated";
import prisma from "@/prisma";

async function findByUrl(url: string, userId: string) {
	const data = await prisma.article.findUnique({
		where: { url_userId: { url, userId } },
		select: {
			url: true,
			Category: true,
			title: true,
			ogTitle: true,
			ogDescription: true,
			quote: true,
			ogImageUrl: true,
		},
	});
	return data;
}

async function findMany(
	userId: string,
	status: Status,
	params: ArticlesFindManyParams,
) {
	const data = await prisma.article.findMany({
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
}

async function count(userId: string, status: Status): Promise<number> {
	const data = await prisma.article.count({ where: { userId, status } });
	return data;
}

async function search(
	query: string,
	userId: UserId,
	limit = 20,
): Promise<
	{
		id: string;
		title: string;
		url: string;
		quote: string | null;
		ogTitle: string | null;
		ogDescription: string | null;
		Category: {
			id: string;
			name: string;
		};
	}[]
> {
	const where: Prisma.ArticleWhereInput = {
		userId,
		status: "EXPORTED",
		...(query
			? {
					OR: [
						{ title: { contains: query, mode: "insensitive" } },
						{ quote: { contains: query, mode: "insensitive" } },
						{ ogTitle: { contains: query, mode: "insensitive" } },
						{ ogDescription: { contains: query, mode: "insensitive" } },
					],
				}
			: {}),
	};
	const data = await prisma.article.findMany({
		where,
		select: {
			id: true,
			title: true,
			url: true,
			quote: true,
			ogTitle: true,
			ogDescription: true,
			categoryId: true,
			Category: { select: { name: true, id: true } },
		},
		take: limit,
		orderBy: { createdAt: "desc" },
	});
	return data;
}

export const articlesQueryRepository: IArticlesQueryRepository = {
	findByUrl,
	findMany,
	count,
	search,
};

async function findManyCategories(
	userId: string,
	params?: CategoryFindManyParams,
) {
	const data = await prisma.category.findMany({
		where: { userId },
		select: { id: true, name: true },
		...params,
	});
	return data;
}

export const categoryQueryRepository: ICategoryQueryRepository = {
	findMany: findManyCategories,
};

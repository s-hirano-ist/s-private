import {
	type ArticleListItemDTO,
	type ArticleSearchItemDTO,
	type ExportedArticle,
	makeArticleTitle,
	makeCategoryName,
	makeOgDescription,
	makeOgImageUrl,
	makeOgTitle,
	makeQuote,
	makeUrl,
	type UnexportedArticle,
} from "@s-hirano-ist/s-core/articles/entities/article-entity";
import type {
	ArticlesFindManyParams,
	IArticlesQueryRepository,
} from "@s-hirano-ist/s-core/articles/repositories/articles-query-repository.interface";
import type {
	CategoryFindManyParams,
	ICategoryQueryRepository,
} from "@s-hirano-ist/s-core/articles/repositories/category-query-repository.interface";
import {
	type Id,
	makeCreatedAt,
	makeExportedAt,
	makeId,
	makeUserId,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import type { Prisma } from "@s-hirano-ist/s-database";
import prisma from "@/prisma";

async function findByUrl(
	url: string,
	userId: string,
): Promise<UnexportedArticle | ExportedArticle | null> {
	const data = await prisma.article.findUnique({
		where: { url_userId: { url, userId } },
		select: {
			id: true,
			userId: true,
			categoryId: true,
			url: true,
			Category: { select: { name: true } },
			title: true,
			ogTitle: true,
			ogDescription: true,
			ogImageUrl: true,
			quote: true,
			status: true,
			createdAt: true,
			exportedAt: true,
		},
	});
	if (!data) return null;

	const base = {
		id: makeId(data.id),
		userId: makeUserId(data.userId),
		categoryId: makeId(data.categoryId),
		categoryName: makeCategoryName(data.Category.name),
		title: makeArticleTitle(data.title),
		quote: makeQuote(data.quote),
		url: makeUrl(data.url),
		createdAt: makeCreatedAt(data.createdAt),
		ogTitle: makeOgTitle(data.ogTitle),
		ogDescription: makeOgDescription(data.ogDescription),
		ogImageUrl: makeOgImageUrl(data.ogImageUrl),
	};

	if (data.status === "EXPORTED" && data.exportedAt) {
		return Object.freeze({
			...base,
			status: "EXPORTED" as const,
			exportedAt: makeExportedAt(data.exportedAt),
		});
	}
	return Object.freeze({ ...base, status: "UNEXPORTED" as const });
}

async function findMany(
	userId: string,
	status: Status,
	params: ArticlesFindManyParams,
): Promise<ArticleListItemDTO[]> {
	const data = await prisma.article.findMany({
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
	});
	return data.map((d) => ({
		id: makeId(d.id),
		title: makeArticleTitle(d.title),
		url: makeUrl(d.url),
		quote: makeQuote(d.quote),
		ogTitle: makeOgTitle(d.ogTitle),
		ogDescription: makeOgDescription(d.ogDescription),
		categoryName: makeCategoryName(d.Category.name),
	}));
}

async function count(userId: string, status: Status): Promise<number> {
	return prisma.article.count({ where: { userId, status } });
}

async function search(
	query: string,
	userId: UserId,
	limit = 20,
): Promise<ArticleSearchItemDTO[]> {
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
			Category: { select: { name: true } },
		},
		take: limit,
		orderBy: { createdAt: "desc" },
	});
	return data.map((d) => ({
		id: makeId(d.id),
		title: makeArticleTitle(d.title),
		url: makeUrl(d.url),
		quote: makeQuote(d.quote),
		ogTitle: makeOgTitle(d.ogTitle),
		ogDescription: makeOgDescription(d.ogDescription),
		categoryName: makeCategoryName(d.Category.name),
	}));
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
	return data.map((d) => ({
		id: makeId(d.id),
		name: makeCategoryName(d.name),
	}));
}

async function findByNameAndUser(
	name: string,
	userId: string,
): Promise<{ id: Id } | null> {
	const data = await prisma.category.findUnique({
		where: { name_userId: { name, userId } },
		select: { id: true },
	});
	return data ? { id: makeId(data.id) } : null;
}

export const categoryQueryRepository: ICategoryQueryRepository = {
	findMany: findManyCategories,
	findByNameAndUser,
};

import {
	makeArticleTitle,
	type UnexportedArticle,
} from "@s-hirano-ist/s-core/articles/entities/article-entity";
import type {
	DeleteArticleResult,
	IArticlesCommandRepository,
} from "@s-hirano-ist/s-core/articles/repositories/articles-command-repository.interface";
import type {
	Id,
	Status,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { revalidateTag } from "next/cache";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";
import prisma from "@/prisma";

async function create(data: UnexportedArticle): Promise<void> {
	await prisma.article.create({
		data: {
			id: data.id,
			title: data.title,
			url: data.url,
			quote: data.quote,
			userId: data.userId,
			status: data.status,
			categoryId: data.categoryId,
			createdAt: data.createdAt,
		},
	});

	revalidateTag(buildContentCacheTag("articles", data.status, data.userId), {
		expire: 0,
	});
	revalidateTag(buildCountCacheTag("articles", data.status, data.userId), {
		expire: 0,
	});
	revalidateTag("categories", { expire: 0 });
}

async function deleteById(
	id: Id,
	userId: UserId,
	status: Status,
): Promise<DeleteArticleResult> {
	const data = await prisma.article.delete({
		where: { id, userId, status },
		select: { title: true },
	});

	revalidateTag(buildContentCacheTag("articles", status, userId), {
		expire: 0,
	});
	revalidateTag(buildCountCacheTag("articles", status, userId), { expire: 0 });

	return { title: makeArticleTitle(data.title) };
}

export const articlesCommandRepository: IArticlesCommandRepository = {
	create,
	deleteById,
};

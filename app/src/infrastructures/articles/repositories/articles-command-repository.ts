import type { UnexportedArticle } from "@s-hirano-ist/s-core/articles/entities/article-entity";
import type {
	DeleteArticleResult,
	IArticlesCommandRepository,
} from "@s-hirano-ist/s-core/articles/repositories/articles-command-repository.interface";
import type {
	Id,
	Status,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { uuidv7 } from "@s-hirano-ist/s-core/shared-kernel/services/id-generator";
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
			Category: {
				connectOrCreate: {
					where: {
						name_userId: {
							name: data.categoryName,
							userId: data.userId,
						},
					},
					create: {
						name: data.categoryName,
						userId: data.userId,
						id: uuidv7(),
						createdAt: data.createdAt,
					},
				},
			},
			createdAt: data.createdAt,
		},
	});
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
	return { title: data.title };
}

export const articlesCommandRepository: IArticlesCommandRepository = {
	create,
	deleteById,
};

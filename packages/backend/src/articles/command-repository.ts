import type { DatabaseClient } from "@s-hirano-ist/s-backend/shared/database";
import type {
	DeleteArticleResult,
	IArticlesCommandRepository,
} from "@s-hirano-ist/s-core/articles/repositories/articles-command-repository.interface";
import type {
	Id,
	Status,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import {
	makeArticleTitle,
	type UnexportedArticle,
} from "@s-hirano-ist/s-core/articles/entities/article-entity";

export function createArticlesCommandRepository(
	prisma: Pick<DatabaseClient, "article">,
) {
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

		return { title: makeArticleTitle(data.title) };
	}

	const articlesCommandRepository: IArticlesCommandRepository = {
		create,
		deleteById,
	};

	return articlesCommandRepository;
}

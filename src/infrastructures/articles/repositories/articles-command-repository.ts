import type { Article } from "@/domains/articles/entities/article-entity";
import { ArticleCreatedEvent } from "@/domains/articles/events/article-created-event";
import { ArticleDeletedEvent } from "@/domains/articles/events/article-deleted-event";
import type { IArticlesCommandRepository } from "@/domains/articles/repositories/articles-command-repository.interface";
import type {
	Id,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";
import prisma from "@/prisma";

initializeEventHandlers();

async function create(data: Article) {
	const response = await prisma.article.create({
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
						id: data.categoryId,
						createdAt: data.createdAt,
					},
				},
			},
			createdAt: data.createdAt,
		},
		select: {
			url: true,
			title: true,
			quote: true,
			Category: { select: { name: true } },
			userId: true,
		},
	});
	await eventDispatcher.dispatch(
		new ArticleCreatedEvent({
			title: response.title,
			url: response.url,
			quote: response.quote ?? "",
			categoryName: response.Category.name,
			userId: response.userId,
			caller: "addArticle",
		}),
	);
}

async function deleteById(id: Id, userId: UserId, status: Status) {
	const data = await prisma.article.delete({
		where: { id, userId, status },
		select: { title: true },
	});
	await eventDispatcher.dispatch(
		new ArticleDeletedEvent({
			title: data.title,
			userId,
			caller: "deleteArticle",
		}),
	);
}

export const articlesCommandRepository: IArticlesCommandRepository = {
	create,
	deleteById,
};

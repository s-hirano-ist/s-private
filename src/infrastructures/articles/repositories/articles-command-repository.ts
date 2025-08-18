import type { Article } from "@/domains/articles/entities/article-entity";
import type { IArticlesCommandRepository } from "@/domains/articles/repositories/articles-command-repository.interface";
import type {
	Id,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import { serverLogger } from "@/infrastructures/observability/server";
import prisma from "@/prisma";

class ArticlesCommandRepository implements IArticlesCommandRepository {
	async create(data: Article) {
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
						},
					},
				},
			},
			select: {
				url: true,
				title: true,
				quote: true,
				Category: { select: { name: true } },
				userId: true,
			},
		});
		serverLogger.info(
			`【ARTICLE】\n\nコンテンツ\ntitle: ${response.title} \nquote: ${response.quote} \nurl: ${response.url}\ncategory: ${response.Category.name}\nの登録ができました`,
			{ caller: "addArticle", status: 201, userId: response.userId },
			{ notify: true },
		);
	}

	async deleteById(id: Id, userId: UserId, status: Status) {
		const data = await prisma.article.delete({
			where: { id, userId, status },
			select: { title: true },
		});
		serverLogger.info(
			`【ARTICLE】\n\n削除\ntitle: ${data.title}`,
			{ caller: "deleteArticle", status: 200, userId },
			{ notify: true },
		);
	}
}

export const articlesCommandRepository = new ArticlesCommandRepository();

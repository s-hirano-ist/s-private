import type {
	Id,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import type { News } from "@/domains/news/entities/news-entity";
import type { INewsCommandRepository } from "@/domains/news/repositories/news-command-repository.interface";
import { serverLogger } from "@/infrastructures/observability/server";
import prisma from "@/prisma";

class NewsCommandRepository implements INewsCommandRepository {
	async create(data: News) {
		const response = await prisma.news.create({
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
			`【NEWS】\n\nコンテンツ\ntitle: ${response.title} \nquote: ${response.quote} \nurl: ${response.url}\ncategory: ${response.Category.name}\nの登録ができました`,
			{ caller: "addNews", status: 201, userId: response.userId },
			{ notify: true },
		);
	}

	async deleteById(id: Id, userId: UserId, status: Status) {
		const data = await prisma.news.delete({
			where: { id, userId, status },
			select: { title: true },
		});
		serverLogger.info(
			`【NEWS】\n\n削除\ntitle: ${data.title}`,
			{ caller: "deleteNews", status: 200, userId },
			{ notify: true },
		);
	}
}

export const newsCommandRepository = new NewsCommandRepository();

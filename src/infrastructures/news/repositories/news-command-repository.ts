import { Status } from "@/domains/common/entities/common-entity";
import { NewsFormSchema } from "@/domains/news/entities/news-entity";
import type { INewsCommandRepository } from "@/domains/news/types";
import { serverLogger } from "@/infrastructures/observability/server";
import prisma from "@/prisma";

class NewsCommandRepository implements INewsCommandRepository {
	async create(data: NewsFormSchema): Promise<void> {
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
								name: data.category.name,
								userId: data.userId,
							},
						},
						create: {
							name: data.category.name,
							userId: data.category.userId,
							id: data.category.id,
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

	async deleteById(id: string, userId: string, status: Status): Promise<void> {
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

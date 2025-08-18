import { DomainError, Result } from "@/domains/common/value-objects";
import type {
	NewsAggregate,
	NewsId,
	NewsStatus,
	UserId,
} from "@/domains/news/entities/news-entity";
import type { INewsCommandRepository } from "@/domains/news/types";
import {
	CategoryName,
	NewsQuote,
	NewsTitle,
	NewsUrl,
} from "@/domains/news/value-objects";
import { serverLogger } from "@/infrastructures/observability/server";
import prisma from "@/prisma";

// Functional news command repository
export const newsCommandRepository: INewsCommandRepository = {
	save: async (news: NewsAggregate): Promise<Result<void, DomainError>> => {
		try {
			const response = await prisma.news.create({
				data: {
					id: news.id,
					title: NewsTitle.unwrap(news.title),
					url: NewsUrl.unwrap(news.url),
					quote: news.quote ? NewsQuote.unwrap(news.quote) : null,
					userId: news.userId,
					status: news.status,
					Category: {
						connectOrCreate: {
							where: {
								name_userId: {
									name: CategoryName.unwrap(news.category.name),
									userId: news.userId,
								},
							},
							create: {
								name: CategoryName.unwrap(news.category.name),
								userId: news.category.userId,
								id: news.category.id,
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

			return Result.success(undefined);
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes("Unique constraint")
			) {
				return Result.failure(
					DomainError.duplicate(
						"News with this URL already exists",
						"news",
						NewsUrl.unwrap(news.url),
					),
				);
			}

			return Result.failure(
				DomainError.infrastructure("Failed to save news", "database", {
					cause: error,
				}),
			);
		}
	},

	delete: async (
		id: NewsId,
		userId: UserId,
		status: NewsStatus,
	): Promise<Result<void, DomainError>> => {
		try {
			const data = await prisma.news.delete({
				where: { id, userId, status },
				select: { title: true },
			});

			serverLogger.info(
				`【NEWS】\n\n削除\ntitle: ${data.title}`,
				{ caller: "deleteNews", status: 200, userId },
				{ notify: true },
			);

			return Result.success(undefined);
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes("Record to delete does not exist")
			) {
				return Result.failure(
					DomainError.notFound("News not found", "news", id),
				);
			}

			return Result.failure(
				DomainError.infrastructure("Failed to delete news", "database", {
					cause: error,
				}),
			);
		}
	},
};

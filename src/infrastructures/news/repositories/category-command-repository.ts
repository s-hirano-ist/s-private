import { DomainError, Result } from "@/domains/common/value-objects";
import type {
	CategoryAggregate,
	CategoryId,
	UserId,
} from "@/domains/news/entities/news-entity";
import type { ICategoryCommandRepository } from "@/domains/news/types";
import { CategoryName } from "@/domains/news/value-objects";
import { serverLogger } from "@/infrastructures/observability/server";
import prisma from "@/prisma";

// Functional category command repository
export const categoryCommandRepository: ICategoryCommandRepository = {
	save: async (
		category: CategoryAggregate,
	): Promise<Result<void, DomainError>> => {
		try {
			const response = await prisma.categories.upsert({
				where: {
					name_userId: {
						name: CategoryName.unwrap(category.name),
						userId: category.userId,
					},
				},
				update: {
					updatedAt: new Date(),
				},
				create: {
					id: category.id,
					name: CategoryName.unwrap(category.name),
					userId: category.userId,
				},
				select: {
					name: true,
					userId: true,
				},
			});

			serverLogger.info(
				`【CATEGORY】\n\nカテゴリー\nname: ${response.name}\nの登録ができました`,
				{ caller: "saveCategory", status: 201, userId: response.userId },
				{ notify: false },
			);

			return Result.success(undefined);
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes("Unique constraint")
			) {
				return Result.failure(
					DomainError.duplicate(
						"Category with this name already exists",
						"category",
						CategoryName.unwrap(category.name),
					),
				);
			}

			return Result.failure(
				DomainError.infrastructure("Failed to save category", "database", {
					cause: error,
				}),
			);
		}
	},

	delete: async (
		id: CategoryId,
		userId: UserId,
	): Promise<Result<void, DomainError>> => {
		try {
			const data = await prisma.categories.delete({
				where: { id, userId },
				select: { name: true },
			});

			serverLogger.info(
				`【CATEGORY】\n\n削除\nname: ${data.name}`,
				{ caller: "deleteCategory", status: 200, userId },
				{ notify: false },
			);

			return Result.success(undefined);
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes("Record to delete does not exist")
			) {
				return Result.failure(
					DomainError.notFound("Category not found", "category", id),
				);
			}

			return Result.failure(
				DomainError.infrastructure("Failed to delete category", "database", {
					cause: error,
				}),
			);
		}
	},
};

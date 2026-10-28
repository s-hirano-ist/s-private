import type { IArticlesQueryRepository } from "@s-hirano-ist/s-core/articles/repositories/articles-query-repository.interface";
import type {
	ICategoryQueryRepository,
	CategoryFindManyParams,
} from "@s-hirano-ist/s-core/articles/repositories/category-query-repository.interface";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import { makeCategoryName } from "@s-hirano-ist/s-core/articles/entities/article-entity";
import {
	makeId,
	type Id,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
export function createArticlesQueryRepositories(
	prisma: Pick<DatabaseClient, "article" | "category">,
) {
	const articlesQueryRepository: IArticlesQueryRepository = {
		async existsByUrl(url, userId) {
			return (
				(await prisma.article.findUnique({
					where: { url_userId: { url, userId } },
					select: { id: true },
				})) !== null
			);
		},
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
		return data.map((d: { id: string; name: string }) => ({
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

	const categoryQueryRepository: ICategoryQueryRepository = {
		findMany: findManyCategories,
		findByNameAndUser,
	};

	return { articlesQueryRepository, categoryQueryRepository };
}

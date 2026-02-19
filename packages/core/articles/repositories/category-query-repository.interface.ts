import type { Id, UserId } from "../../shared-kernel/entities/common-entity.ts";
import type { PaginationOptions } from "../../shared-kernel/types/query-options.ts";
import type { CategoryName } from "../entities/article-entity.ts";
import type { CategoryOrderBy } from "../types/query-params.ts";

/**
 * Parameters for paginated category queries.
 *
 * @example
 * ```typescript
 * const params: CategoryFindManyParams = {
 *   orderBy: { name: "asc" },
 *   take: 50,
 *   skip: 0,
 * };
 * ```
 *
 * @see {@link CategoryOrderBy} for sorting options
 */
export type CategoryFindManyParams = {
	/** Sort configuration */
	orderBy?: CategoryOrderBy;
} & PaginationOptions;

/**
 * DTO for category list display.
 *
 * @remarks
 * Contains branded types for type safety.
 */
export type CategoryListItemDTO = Readonly<{
	id: Id;
	name: CategoryName;
}>;

/**
 * Query repository interface for the Category domain.
 *
 * @remarks
 * Provides read-only access to categories.
 * Categories are used to organize articles into logical groups.
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class PrismaCategoryQueryRepository implements ICategoryQueryRepository {
 *   async findMany(userId: UserId, params?: CategoryFindManyParams) {
 *     const data = await prisma.category.findMany({
 *       where: { userId },
 *       ...params
 *     });
 *     return data.map(d => ({ id: makeId(d.id), name: makeCategoryName(d.name) }));
 *   }
 *
 *   async findByNameAndUser(name: CategoryName, userId: UserId) {
 *     const data = await prisma.category.findUnique({
 *       where: { name_userId: { name, userId } },
 *       select: { id: true }
 *     });
 *     return data ? { id: makeId(data.id) } : null;
 *   }
 * }
 * ```
 *
 * @see {@link CategoryFindManyParams} for query parameters
 */
export type ICategoryQueryRepository = {
	/**
	 * Retrieves multiple categories with optional pagination and sorting.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @param params - Optional pagination and sorting parameters
	 * @returns Array of category DTOs with branded types
	 */
	findMany(
		userId: UserId,
		params?: CategoryFindManyParams,
	): Promise<CategoryListItemDTO[]>;

	/**
	 * Finds a category by name and user ID.
	 *
	 * @param name - The category name to search for
	 * @param userId - The user ID for tenant isolation
	 * @returns The category ID (branded) if found, null otherwise
	 */
	findByNameAndUser(
		name: CategoryName,
		userId: UserId,
	): Promise<{ id: Id } | null>;
};

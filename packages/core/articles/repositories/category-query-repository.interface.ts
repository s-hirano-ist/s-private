import type { CategoryName } from "@s-hirano-ist/s-core/articles/entities/article-entity";
import type { CategoryOrderBy } from "@s-hirano-ist/s-core/articles/types/query-params";
import type {
	Id,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import type { PaginationOptions } from "@s-hirano-ist/s-core/shared-kernel/types/query-options";

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
};

import type { UserId } from "../../shared-kernel/entities/common-entity.js";
import type { CategoryFindManyParams } from "../types/query-params.js";

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
 *     return await prisma.category.findMany({
 *       where: { userId },
 *       ...params
 *     });
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
	 * @returns Array of category data objects
	 */
	findMany(
		userId: UserId,
		params?: CategoryFindManyParams,
	): Promise<
		{
			id: string;
			name: string;
		}[]
	>;
};

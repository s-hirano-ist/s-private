import {
	type Id,
	makeCreatedAt,
	makeId,
	type UserId,
} from "../../shared-kernel/entities/common-entity.js";
import type { CategoryName } from "../entities/article-entity.js";
import type { ICategoryCommandRepository } from "../repositories/category-command-repository.interface.js";
import type { ICategoryQueryRepository } from "../repositories/category-query-repository.interface.js";

/**
 * Domain service for Category resolution.
 *
 * @remarks
 * Encapsulates the business logic for resolving or creating categories.
 * Ensures that category existence check and creation is handled correctly
 * with proper race condition handling.
 *
 * @example
 * ```typescript
 * const categoryService = new CategoryService(queryRepo, commandRepo);
 * const categoryId = await categoryService.resolveOrCreate(categoryName, userId);
 * // Use categoryId when creating articles
 * ```
 *
 * @see {@link ICategoryQueryRepository} for query operations
 * @see {@link ICategoryCommandRepository} for command operations
 */
export class CategoryService {
	/**
	 * Creates a new CategoryService instance.
	 *
	 * @param categoryQueryRepository - The query repository for finding categories
	 * @param categoryCommandRepository - The command repository for creating categories
	 */
	constructor(
		private readonly categoryQueryRepository: ICategoryQueryRepository,
		private readonly categoryCommandRepository: ICategoryCommandRepository,
	) {}

	/**
	 * Resolves an existing category or creates a new one.
	 *
	 * @param categoryName - The category name to resolve
	 * @param userId - The user ID for tenant isolation
	 * @returns The category ID (existing or newly created)
	 *
	 * @remarks
	 * This method handles race conditions where multiple requests might try
	 * to create the same category simultaneously. If a duplicate error occurs
	 * during creation (due to DB unique constraint), it will retry the lookup.
	 *
	 * @example
	 * ```typescript
	 * const categoryId = await categoryService.resolveOrCreate(
	 *   makeCategoryName("Tech"),
	 *   makeUserId("user-123")
	 * );
	 * ```
	 */
	public async resolveOrCreate(
		categoryName: CategoryName,
		userId: UserId,
	): Promise<Id> {
		// 1. Try to find existing category
		const existing = await this.categoryQueryRepository.findByNameAndUser(
			categoryName,
			userId,
		);
		if (existing) {
			return makeId(existing.id);
		}

		// 2. Create new category
		const newId = makeId();
		try {
			await this.categoryCommandRepository.create({
				id: newId,
				name: categoryName,
				userId,
				createdAt: makeCreatedAt(),
			});
			return newId;
		} catch (error) {
			// 3. Handle race condition: if duplicate error, re-fetch
			// This can happen when concurrent requests try to create the same category
			const retried = await this.categoryQueryRepository.findByNameAndUser(
				categoryName,
				userId,
			);
			if (retried) {
				return makeId(retried.id);
			}
			// If still not found, re-throw the original error
			throw error;
		}
	}
}

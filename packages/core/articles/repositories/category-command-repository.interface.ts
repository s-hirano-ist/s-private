import type { CategoryName } from "@s-hirano-ist/s-core/articles/entities/article-entity";
import type {
	CreatedAt,
	Id,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";

/**
 * Command repository interface for the Category domain.
 *
 * @remarks
 * Follows the CQRS pattern - this interface handles write operations only.
 * Implementations should be provided by the infrastructure layer (e.g., Prisma).
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class PrismaCategoryCommandRepository implements ICategoryCommandRepository {
 *   async create(data: CategoryCreateData) {
 *     await prisma.category.create({ data });
 *   }
 * }
 * ```
 *
 * @see {@link ICategoryQueryRepository} for read operations
 */

/**
 * Data required to create a new category.
 */
export type CategoryCreateData = {
	createdAt: CreatedAt;
	id: Id;
	name: CategoryName;
	userId: UserId;
};

export type ICategoryCommandRepository = {
	/**
	 * Creates a new category in the repository.
	 *
	 * @param data - The category data to persist
	 */
	create(data: CategoryCreateData): Promise<void>;
};

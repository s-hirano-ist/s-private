import type {
	CreatedAt,
	Id,
	UserId,
} from "../../shared-kernel/entities/common-entity";
import type { CategoryName } from "../entities/article-entity";

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
	id: Id;
	name: CategoryName;
	userId: UserId;
	createdAt: CreatedAt;
};

export type ICategoryCommandRepository = {
	/**
	 * Creates a new category in the repository.
	 *
	 * @param data - The category data to persist
	 */
	create(data: CategoryCreateData): Promise<void>;
};

import type {
	Id,
	Status,
	UserId,
} from "../../common/entities/common-entity.js";
import type { UnexportedArticle } from "../entities/article-entity.js";

/**
 * Command repository interface for the Article domain.
 *
 * @remarks
 * Follows the CQRS pattern - this interface handles write operations only.
 * Implementations should be provided by the infrastructure layer (e.g., Prisma).
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class PrismaArticlesCommandRepository implements IArticlesCommandRepository {
 *   async create(data: UnexportedArticle) {
 *     await prisma.article.create({ data });
 *   }
 *
 *   async deleteById(id: Id, userId: UserId, status: Status) {
 *     await prisma.article.delete({
 *       where: { id, userId, status }
 *     });
 *   }
 * }
 * ```
 *
 * @see {@link IArticlesQueryRepository} for read operations
 */
export type IArticlesCommandRepository = {
	/**
	 * Creates a new article in the repository.
	 *
	 * @param data - The unexported article entity to persist
	 */
	create(data: UnexportedArticle): Promise<void>;

	/**
	 * Deletes an article by its ID.
	 *
	 * @param id - The article ID to delete
	 * @param userId - The user ID for tenant isolation
	 * @param status - The expected status of the article
	 */
	deleteById(id: Id, userId: UserId, status: Status): Promise<void>;
};

import type {
	Id,
	Status,
	UserId,
} from "../../shared-kernel/entities/common-entity.ts";
import type {
	ArticleTitle,
	UnexportedArticle,
} from "../entities/article-entity.ts";

/**
 * Command repository interface for the Article domain.
 *
 * @remarks
 * Follows the CQRS pattern - this interface handles write operations only.
 * Implementations should be provided by the infrastructure layer (e.g., Prisma).
 *
 * For batch operations (bulkUpdateStatus), use {@link IBatchCommandRepository}
 * from the common module directly.
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
 * @see {@link IBatchCommandRepository} for batch operations
 */
/**
 * Result of a delete operation containing data needed for events.
 */
export type DeleteArticleResult = {
	title: ArticleTitle;
};

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
	 * @returns The deleted article data needed for domain events
	 */
	deleteById(
		id: Id,
		userId: UserId,
		status: Status,
	): Promise<DeleteArticleResult>;
};

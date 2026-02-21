import type {
	Status,
	UserId,
} from "../../shared-kernel/entities/common-entity.ts";
import type { InfraQueryOptions } from "../../shared-kernel/types/query-options.ts";
import type {
	ArticleListItemDTO,
	ExportedArticle,
	UnexportedArticle,
	Url,
} from "../entities/article-entity.ts";
import type { ArticleOrderBy } from "../types/query-params.ts";
import type { IArticlesCommandRepository } from "./articles-command-repository.interface.ts";

/**
 * Parameters for paginated article queries.
 *
 * @example
 * ```typescript
 * const params: ArticlesFindManyParams = {
 *   orderBy: { createdAt: "desc" },
 *   take: 20,
 *   skip: 0,
 * };
 * ```
 *
 * @see {@link ArticleOrderBy} for sorting options
 */
export type ArticlesFindManyParams = {
	/** Sort configuration */
	orderBy?: ArticleOrderBy;
} & InfraQueryOptions;

/**
 * Query repository interface for the Article domain.
 *
 * @remarks
 * Follows the CQRS pattern - this interface handles read operations only.
 * Implementations should be provided by the infrastructure layer (e.g., Prisma).
 *
 * Return types are either full entities (for single item lookup) or DTOs
 * (for list/search operations) with properly branded types.
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class PrismaArticlesQueryRepository implements IArticlesQueryRepository {
 *   async findByUrl(url: Url, userId: UserId) {
 *     const data = await prisma.article.findUnique({
 *       where: { url, userId }
 *     });
 *     return data ? toArticleEntity(data) : null;
 *   }
 * }
 * ```
 *
 * @see {@link IArticlesCommandRepository} for write operations
 */
export type IArticlesQueryRepository = {
	/**
	 * Finds an article by its URL for a specific user.
	 *
	 * @param url - The validated URL to search for
	 * @param userId - The user ID for tenant isolation
	 * @returns The article entity if found, null otherwise
	 *
	 * @remarks
	 * Returns a full entity type (UnexportedArticle or ExportedArticle)
	 * for domain operations like duplicate checking.
	 */
	findByUrl(
		url: Url,
		userId: UserId,
	): Promise<UnexportedArticle | ExportedArticle | null>;

	/**
	 * Retrieves multiple articles with pagination and filtering.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @param status - Filter by UNEXPORTED or EXPORTED status
	 * @param params - Pagination, sorting, and caching parameters
	 * @returns Array of ArticleListItemDTO objects
	 *
	 * @remarks
	 * Returns DTOs with `categoryName` for direct property access,
	 * avoiding nested `Category.name` pattern.
	 *
	 * @see {@link ArticlesFindManyParams} for parameter options
	 */
	findMany(
		userId: UserId,
		status: Status,
		params: ArticlesFindManyParams,
	): Promise<ArticleListItemDTO[]>;

	/**
	 * Counts articles matching the given criteria.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @param status - Filter by status
	 * @returns The count of matching articles
	 */
	count(userId: UserId, status: Status): Promise<number>;
};

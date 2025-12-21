import type { Status, UserId } from "../../common/entities/common-entity";
import type { Url } from "../entities/article-entity";
import type { ArticlesFindManyParams } from "../types/query-params";

/**
 * Query repository interface for the Article domain.
 *
 * @remarks
 * Follows the CQRS pattern - this interface handles read operations only.
 * Implementations should be provided by the infrastructure layer (e.g., Prisma).
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class PrismaArticlesQueryRepository implements IArticlesQueryRepository {
 *   async findByUrl(url: Url, userId: UserId) {
 *     return await prisma.article.findUnique({
 *       where: { url, userId }
 *     });
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
	 * @returns The article data if found, null otherwise
	 */
	findByUrl(
		url: Url,
		userId: UserId,
	): Promise<{
		title: string;
		url: string;
		quote: string | null;
		ogTitle: string | null;
		ogDescription: string | null;
		ogImageUrl: string | null;
		status: string;
		Category: {
			id: string;
			name: string;
		};
	} | null>;

	/**
	 * Retrieves multiple articles with pagination and filtering.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @param status - Filter by UNEXPORTED or EXPORTED status
	 * @param params - Pagination, sorting, and caching parameters
	 * @returns Array of article data objects
	 *
	 * @see {@link ArticlesFindManyParams} for parameter options
	 */
	findMany(
		userId: UserId,
		status: Status,
		params: ArticlesFindManyParams,
	): Promise<
		{
			id: string;
			title: string;
			url: string;
			quote: string | null;
			ogTitle: string | null;
			ogDescription: string | null;
			Category: {
				id: string;
				name: string;
			};
		}[]
	>;

	/**
	 * Counts articles matching the given criteria.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @param status - Filter by status
	 * @returns The count of matching articles
	 */
	count(userId: UserId, status: Status): Promise<number>;

	/**
	 * Searches articles by text query.
	 *
	 * @param query - The search query string
	 * @param userId - The user ID for tenant isolation
	 * @param limit - Optional maximum number of results (default varies by implementation)
	 * @returns Array of matching article data objects
	 */
	search(
		query: string,
		userId: UserId,
		limit?: number,
	): Promise<
		{
			id: string;
			title: string;
			url: string;
			quote: string | null;
			ogTitle: string | null;
			ogDescription: string | null;
			Category: { id: string; name: string };
		}[]
	>;
};

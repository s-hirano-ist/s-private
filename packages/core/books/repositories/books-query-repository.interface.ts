import type { Status, UserId } from "../../common/entities/common-entity.js";
import type { ISBN } from "../entities/books-entity.js";
import type { BooksFindManyParams } from "../types/query-params.js";

/**
 * Query repository interface for the Book domain.
 *
 * @remarks
 * Follows the CQRS pattern - this interface handles read operations only.
 * Implementations should be provided by the infrastructure layer (e.g., Prisma).
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class PrismaBooksQueryRepository implements IBooksQueryRepository {
 *   async findByISBN(ISBN: ISBN, userId: UserId) {
 *     return await prisma.book.findUnique({
 *       where: { ISBN, userId }
 *     });
 *   }
 * }
 * ```
 *
 * @see {@link IBooksCommandRepository} for write operations
 */
export type IBooksQueryRepository = {
	/**
	 * Finds a book by its ISBN for a specific user.
	 *
	 * @param ISBN - The validated ISBN to search for
	 * @param userId - The user ID for tenant isolation
	 * @returns The book data if found, null otherwise
	 */
	findByISBN(
		ISBN: ISBN,
		userId: UserId,
	): Promise<{
		ISBN: string;
		id: string;
		title: string;
		googleTitle: string | null;
		googleSubTitle: string | null;
		googleAuthors: string[];
		googleDescription: string | null;
		googleImgSrc: string | null;
		googleHref: string | null;
		markdown: string | null;
		rating: number | null;
		tags: string[];
		status: string;
		createdAt: Date;
		updatedAt: Date;
		exportedAt: Date | null;
	} | null>;

	/**
	 * Retrieves multiple books with pagination and filtering.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @param status - Filter by UNEXPORTED or EXPORTED status
	 * @param params - Optional pagination, sorting, and caching parameters
	 * @returns Array of book data objects
	 *
	 * @see {@link BooksFindManyParams} for parameter options
	 */
	findMany(
		userId: UserId,
		status: Status,
		params?: BooksFindManyParams,
	): Promise<
		{
			ISBN: string;
			id: string;
			title: string;
			googleTitle: string | null;
			googleSubTitle: string | null;
			googleAuthors: string[];
			googleDescription: string | null;
			googleImgSrc: string | null;
			googleHref: string | null;
			markdown: string | null;
			rating: number | null;
			tags: string[];
			createdAt: Date;
			updatedAt: Date;
			exportedAt: Date | null;
		}[]
	>;

	/**
	 * Counts books matching the given criteria.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @param status - Filter by status
	 * @returns The count of matching books
	 */
	count(userId: UserId, status: Status): Promise<number>;

	/**
	 * Searches books by text query.
	 *
	 * @param query - The search query string
	 * @param userId - The user ID for tenant isolation
	 * @param limit - Optional maximum number of results
	 * @returns Array of matching book data objects
	 */
	search(
		query: string,
		userId: UserId,
		limit?: number,
	): Promise<
		{
			id: string;
			title: string;
			ISBN: string;
			googleTitle: string | null;
			googleSubTitle: string | null;
			googleAuthors: string[];
			googleDescription: string | null;
			markdown: string | null;
			rating: number | null;
			tags: string[];
		}[]
	>;
};

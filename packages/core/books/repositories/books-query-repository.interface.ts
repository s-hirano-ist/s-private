import type {
	Status,
	UserId,
} from "../../shared-kernel/entities/common-entity.js";
import type {
	BookListItemDTO,
	BookSearchItemDTO,
	ExportedBook,
	ISBN,
	UnexportedBook,
} from "../entities/books-entity.js";
import type { BooksFindManyParams } from "../types/query-params.js";

/**
 * Query repository interface for the Book domain.
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
 * class PrismaBooksQueryRepository implements IBooksQueryRepository {
 *   async findByISBN(ISBN: ISBN, userId: UserId) {
 *     const data = await prisma.book.findUnique({
 *       where: { ISBN, userId }
 *     });
 *     return data ? toBookEntity(data) : null;
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
	 * @returns The book entity if found, null otherwise
	 *
	 * @remarks
	 * Returns a full entity type (UnexportedBook or ExportedBook)
	 * for domain operations like duplicate checking.
	 */
	findByISBN(
		ISBN: ISBN,
		userId: UserId,
	): Promise<UnexportedBook | ExportedBook | null>;

	/**
	 * Retrieves multiple books with pagination and filtering.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @param status - Filter by UNEXPORTED or EXPORTED status
	 * @param params - Optional pagination, sorting, and caching parameters
	 * @returns Array of BookListItemDTO objects
	 *
	 * @see {@link BooksFindManyParams} for parameter options
	 */
	findMany(
		userId: UserId,
		status: Status,
		params?: BooksFindManyParams,
	): Promise<BookListItemDTO[]>;

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
	 * @returns Array of BookSearchItemDTO objects
	 */
	search(
		query: string,
		userId: UserId,
		limit?: number,
	): Promise<BookSearchItemDTO[]>;

	/**
	 * Retrieves a book cover image from MinIO storage.
	 *
	 * @param path - The storage path for the image
	 * @param isThumbnail - Whether to retrieve the thumbnail or original image
	 * @returns A readable stream of the image data
	 */
	getImageFromStorage(
		path: string,
		isThumbnail: boolean,
	): Promise<NodeJS.ReadableStream>;
};

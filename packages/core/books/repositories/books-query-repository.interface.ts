import type {
	Status,
	UserId,
} from "../../shared-kernel/entities/common-entity.js";
import type { InfraQueryOptions } from "../../shared-kernel/types/query-options.js";
import type {
	BookListItemDTO,
	ExportedBook,
	ISBN,
	UnexportedBook,
} from "../entities/book-entity.js";
import type { BooksOrderBy } from "../types/query-params.js";
import type { IBooksCommandRepository } from "./books-command-repository.interface.js";

/**
 * Parameters for paginated book queries.
 *
 * @example
 * ```typescript
 * const params: BooksFindManyParams = {
 *   orderBy: { createdAt: "desc" },
 *   take: 20,
 *   skip: 0,
 * };
 * ```
 *
 * @see {@link BooksOrderBy} for sorting options
 */
export type BooksFindManyParams = {
	/** Sort configuration */
	orderBy?: BooksOrderBy;
} & InfraQueryOptions;

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
 *   async findByISBN(isbn: ISBN, userId: UserId) {
 *     const data = await prisma.book.findUnique({
 *       where: { isbn, userId }
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
	 * @param isbn - The validated ISBN to search for
	 * @param userId - The user ID for tenant isolation
	 * @returns The book entity if found, null otherwise
	 *
	 * @remarks
	 * Returns a full entity type (UnexportedBook or ExportedBook)
	 * for domain operations like duplicate checking.
	 */
	findByISBN(
		isbn: ISBN,
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
};

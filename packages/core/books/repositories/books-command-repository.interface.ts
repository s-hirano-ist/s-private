import type {
	Id,
	Status,
	UserId,
} from "../../common/entities/common-entity.js";
import type {
	BulkUpdateResult,
	IBatchCommandRepository,
	StatusTransitionParams,
} from "../../common/repositories/batch-command-repository.interface.js";
import type { UnexportedBook } from "../entities/books-entity.js";

/**
 * Command repository interface for the Book domain.
 *
 * @remarks
 * Follows the CQRS pattern - this interface handles write operations only.
 * Implementations should be provided by the infrastructure layer (e.g., Prisma).
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class PrismaBooksCommandRepository implements IBooksCommandRepository {
 *   async create(data: UnexportedBook) {
 *     await prisma.book.create({ data });
 *   }
 *
 *   async deleteById(id: Id, userId: UserId, status: Status) {
 *     await prisma.book.delete({
 *       where: { id, userId, status }
 *     });
 *   }
 * }
 * ```
 *
 * @see {@link IBooksQueryRepository} for read operations
 */
export type IBooksCommandRepository = IBatchCommandRepository & {
	/**
	 * Creates a new book in the repository.
	 *
	 * @param data - The unexported book entity to persist
	 */
	create(data: UnexportedBook): Promise<void>;

	/**
	 * Deletes a book by its ID.
	 *
	 * @param id - The book ID to delete
	 * @param userId - The user ID for tenant isolation
	 * @param status - The expected status of the book
	 */
	deleteById(id: Id, userId: UserId, status: Status): Promise<void>;

	/**
	 * Fetches books from an external GitHub repository.
	 *
	 * @remarks
	 * Used for importing book data from external sources.
	 *
	 * @returns Array of unexported book entities
	 */
	fetchBookFromGitHub(): Promise<UnexportedBook[]>;
};

// Re-export for convenience
export type { BulkUpdateResult, StatusTransitionParams };

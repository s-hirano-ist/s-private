import type { UserId } from "../../common/entities/common-entity";
import { DuplicateError } from "../../errors/error-classes";
import type { ISBN } from "../entities/books-entity";
import type { IBooksQueryRepository } from "../repositories/books-query-repository.interface";

/**
 * Checks if a book with the given ISBN already exists.
 *
 * @param booksQueryRepository - The query repository to check against
 * @param ISBN - The ISBN to check for duplicates
 * @param userId - The user ID for tenant isolation
 * @throws {DuplicateError} When a book with this ISBN already exists
 *
 * @internal
 */
async function ensureNoDuplicateBook(
	booksQueryRepository: IBooksQueryRepository,
	ISBN: ISBN,
	userId: UserId,
): Promise<void> {
	const exists = await booksQueryRepository.findByISBN(ISBN, userId);
	if (exists !== null) throw new DuplicateError();
}

/**
 * Domain service for Book business logic.
 *
 * @remarks
 * Encapsulates complex business rules that don't belong to a single entity.
 * Uses dependency injection for repository access.
 *
 * @example
 * ```typescript
 * const queryRepo: IBooksQueryRepository = new PrismaBooksQueryRepository();
 * const domainService = new BooksDomainService(queryRepo);
 *
 * try {
 *   await domainService.ensureNoDuplicate(isbn, userId);
 *   // Safe to create the book
 * } catch (error) {
 *   if (error instanceof DuplicateError) {
 *     // Handle duplicate ISBN
 *   }
 * }
 * ```
 *
 * @see {@link IBooksQueryRepository} for repository interface
 * @see {@link DuplicateError} for duplicate handling
 */
export class BooksDomainService {
	/**
	 * Creates a new BooksDomainService instance.
	 *
	 * @param booksQueryRepository - The query repository for checking duplicates
	 */
	constructor(private readonly booksQueryRepository: IBooksQueryRepository) {}

	/**
	 * Validates that no book with the same ISBN exists for the user.
	 *
	 * @param ISBN - The ISBN to check for duplicates
	 * @param userId - The user ID for tenant isolation
	 * @throws {DuplicateError} When a book with this ISBN already exists
	 *
	 * @remarks
	 * This is a domain invariant check that should be called before creating books.
	 */
	public async ensureNoDuplicate(ISBN: ISBN, userId: UserId) {
		return ensureNoDuplicateBook(this.booksQueryRepository, ISBN, userId);
	}
}

import type { UserId } from "../../shared-kernel/entities/common-entity";
import { DuplicateError } from "../../shared-kernel/errors/error-classes";
import type { Url } from "../entities/article-entity";
import type { IArticlesQueryRepository } from "../repositories/articles-query-repository.interface";

/**
 * Domain service for Article business logic.
 *
 * @remarks
 * Encapsulates complex business rules that don't belong to a single entity.
 * Uses dependency injection for repository access.
 *
 * @example
 * ```typescript
 * const queryRepo: IArticlesQueryRepository = new PrismaArticlesQueryRepository();
 * const domainService = new ArticlesDomainService(queryRepo);
 *
 * try {
 *   await domainService.ensureNoDuplicate(url, userId);
 *   // Safe to create the article
 * } catch (error) {
 *   if (error instanceof DuplicateError) {
 *     // Handle duplicate URL
 *   }
 * }
 * ```
 *
 * @see {@link IArticlesQueryRepository} for repository interface
 * @see {@link DuplicateError} for duplicate handling
 */
export class ArticlesDomainService {
	/**
	 * Creates a new ArticlesDomainService instance.
	 *
	 * @param articlesQueryRepository - The query repository for checking duplicates
	 */
	constructor(
		private readonly articlesQueryRepository: IArticlesQueryRepository,
	) {}

	/**
	 * Validates that no article with the same URL exists for the user.
	 *
	 * @param url - The URL to check for duplicates
	 * @param userId - The user ID for tenant isolation
	 * @throws {DuplicateError} When an article with this URL already exists
	 *
	 * @remarks
	 * This is a domain invariant check that should be called before creating articles.
	 */
	public async ensureNoDuplicate(url: Url, userId: UserId): Promise<void> {
		const exists = await this.articlesQueryRepository.findByUrl(url, userId);
		if (exists !== null) {
			throw new DuplicateError();
		}
	}
}

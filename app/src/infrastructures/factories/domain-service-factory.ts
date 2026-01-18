/**
 * Domain service factory for dependency injection.
 *
 * @remarks
 * This factory provides pre-configured domain service instances with their
 * dependencies already injected. This centralizes instantiation logic and
 * simplifies testing by allowing easy mock injection.
 *
 * @module
 */

import type { IArticlesQueryRepository } from "@s-hirano-ist/s-core/articles/repositories/articles-query-repository.interface";
import { ArticlesDomainService } from "@s-hirano-ist/s-core/articles/services/articles-domain-service";
import type { IBooksQueryRepository } from "@s-hirano-ist/s-core/books/repositories/books-query-repository.interface";
import { BooksDomainService } from "@s-hirano-ist/s-core/books/services/books-domain-service";
import type { INotesQueryRepository } from "@s-hirano-ist/s-core/notes/repositories/notes-query-repository.interface";
import { NotesDomainService } from "@s-hirano-ist/s-core/notes/services/notes-domain-service";
import { articlesQueryRepository } from "@/infrastructures/articles/repositories/articles-query-repository";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";
import { notesQueryRepository } from "@/infrastructures/notes/repositories/notes-query-repository";

/**
 * Factory configuration for domain services.
 *
 * @remarks
 * Allows overriding default repository implementations for testing.
 */
export interface DomainServiceFactoryConfig {
	articlesQueryRepository?: IArticlesQueryRepository;
	booksQueryRepository?: IBooksQueryRepository;
	notesQueryRepository?: INotesQueryRepository;
}

/**
 * Default factory configuration using production repository implementations.
 */
const defaultConfig: Required<DomainServiceFactoryConfig> = {
	articlesQueryRepository,
	booksQueryRepository,
	notesQueryRepository,
};

/**
 * Creates domain service instances with dependency injection.
 *
 * @remarks
 * This factory centralizes the instantiation of domain services with their
 * repository dependencies. It supports:
 * - Default production configuration
 * - Custom configuration for testing (mock injection)
 * - Lazy instantiation for performance
 *
 * @example
 * ```typescript
 * // Production usage
 * const factory = createDomainServiceFactory();
 * const articlesDomainService = factory.createArticlesDomainService();
 *
 * // Test usage with mocks
 * const mockQueryRepo: IArticlesQueryRepository = { ... };
 * const testFactory = createDomainServiceFactory({
 *   articlesQueryRepository: mockQueryRepo,
 * });
 * ```
 */
export function createDomainServiceFactory(
	config: DomainServiceFactoryConfig = {},
) {
	const mergedConfig = { ...defaultConfig, ...config };

	return {
		/**
		 * Creates an ArticlesDomainService instance.
		 *
		 * @returns A new ArticlesDomainService with injected dependencies
		 */
		createArticlesDomainService: (): ArticlesDomainService => {
			return new ArticlesDomainService(mergedConfig.articlesQueryRepository);
		},

		/**
		 * Creates a BooksDomainService instance.
		 *
		 * @returns A new BooksDomainService with injected dependencies
		 */
		createBooksDomainService: (): BooksDomainService => {
			return new BooksDomainService(mergedConfig.booksQueryRepository);
		},

		/**
		 * Creates a NotesDomainService instance.
		 *
		 * @returns A new NotesDomainService with injected dependencies
		 */
		createNotesDomainService: (): NotesDomainService => {
			return new NotesDomainService(mergedConfig.notesQueryRepository);
		},
	};
}

/**
 * Default domain service factory instance.
 *
 * @remarks
 * Pre-configured factory for production use. Import and use directly
 * in application services (Server Actions).
 *
 * @example
 * ```typescript
 * import { domainServiceFactory } from "@/infrastructures/factories/domain-service-factory";
 *
 * export async function addArticle(formData: FormData) {
 *   const articlesDomainService = domainServiceFactory.createArticlesDomainService();
 *   await articlesDomainService.ensureNoDuplicate(url, userId);
 *   // ...
 * }
 * ```
 */
export const domainServiceFactory = createDomainServiceFactory();

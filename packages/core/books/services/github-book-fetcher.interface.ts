import type { UnexportedBook } from "../entities/book-entity";

/**
 * Interface for fetching books from external GitHub repository.
 *
 * @remarks
 * Abstracts the external data source for book imports.
 * Implementations should handle authentication, API calls, and data transformation.
 *
 * This follows the dependency inversion principle - the domain layer defines
 * what it needs, while the infrastructure layer provides the implementation.
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class GitHubBookFetcher implements IGitHubBookFetcher {
 *   async fetchBooks(): Promise<UnexportedBook[]> {
 *     const response = await fetch(GITHUB_API_URL);
 *     const data = await response.json();
 *     return data.map(transformToUnexportedBook);
 *   }
 * }
 * ```
 */
export type IGitHubBookFetcher = {
	/**
	 * Fetches books from an external GitHub repository.
	 *
	 * @returns Array of unexported book entities ready for import
	 */
	fetchBooks(): Promise<UnexportedBook[]>;
};

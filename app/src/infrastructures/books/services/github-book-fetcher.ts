/**
 * GitHub book fetcher implementation.
 *
 * @remarks
 * Fetches book data from a public GitHub repository.
 * Implements the IGitHubBookFetcher interface from the domain layer.
 *
 * @module
 */

import type { UnexportedBook } from "@s-hirano-ist/s-core/books/entities/books-entity";
import type { IGitHubBookFetcher } from "@s-hirano-ist/s-core/books/services/github-book-fetcher.interface";

/**
 * URL for the book data JSON file in the public GitHub repository.
 * @internal
 */
const GITHUB_BOOK_DATA_URL =
	"https://raw.githubusercontent.com/s-hirano-ist/s-public/main/src/data/book/data.gen.json";

async function fetchBooks(): Promise<UnexportedBook[]> {
	try {
		const response = await fetch(GITHUB_BOOK_DATA_URL);
		if (!response.ok) {
			throw new Error(`Failed to fetch book data: ${response.statusText}`);
		}
		const data = await response.json();
		return data as UnexportedBook[];
	} catch (error) {
		console.error("Error fetching book data:", error);
		throw error;
	}
}

/**
 * GitHub-based implementation of IGitHubBookFetcher.
 *
 * @remarks
 * Fetches book data from a public GitHub repository for import.
 */
export const gitHubBookFetcher: IGitHubBookFetcher = {
	fetchBooks,
};

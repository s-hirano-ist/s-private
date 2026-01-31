/**
 * Unified search application service.
 *
 * @remarks
 * Provides full-text search across articles, books, and notes
 * with relevance scoring and snippet extraction.
 *
 * @module
 */

"use server";
import "server-only";
import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import type {
	ArticleSearchResult,
	BookSearchResult,
	NoteSearchResult,
	SearchQuery,
	SearchResult,
	SearchResultGroup,
	UnifiedSearchResults,
} from "@s-hirano-ist/s-core/shared-kernel/types/search-types";
import { articlesQueryRepository } from "@/infrastructures/articles/repositories/articles-query-repository";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";
import { notesQueryRepository } from "@/infrastructures/notes/repositories/notes-query-repository";

/**
 * Truncates text to a maximum length with ellipsis.
 *
 * @internal
 */
function truncateText(text: string, maxLength = 150): string {
	if (text.length <= maxLength) return text;
	return `${text.substring(0, maxLength)}...`;
}

/**
 * Extracts a snippet from text around the query match.
 *
 * @remarks
 * Centers the snippet around the first query match for context.
 *
 * @internal
 */
function extractSnippet(
	text: string | null,
	query: string,
	maxLength = 150,
): string {
	if (!text) return "";

	const queryLower = query.toLowerCase();
	const textLower = text.toLowerCase();
	const queryIndex = textLower.indexOf(queryLower);

	if (queryIndex === -1) {
		return truncateText(text, maxLength);
	}

	const start = Math.max(0, queryIndex - 50);
	const end = Math.min(text.length, queryIndex + query.length + 100);
	const snippet = text.substring(start, end);

	return start > 0 ? `...${snippet}` : snippet;
}

/**
 * Performs unified search across all content types.
 *
 * @remarks
 * Searches articles, books, and notes with:
 * - Configurable content type filtering
 * - Relevance-based result sorting
 * - Snippet extraction for context
 *
 * @param searchQuery - Search query with optional filters
 * @param userId - User ID for data isolation
 * @returns Unified search results grouped by content type
 */
export async function searchContent(
	searchQuery: SearchQuery,
	userId: UserId,
): Promise<UnifiedSearchResults> {
	const { query, contentTypes, limit = 20 } = searchQuery;
	const searchTypes = new Set(contentTypes ?? ["articles", "books", "notes"]);

	const results: SearchResult[] = [];
	const groups: SearchResultGroup[] = [];

	// Search articles
	if (searchTypes.has("articles")) {
		const articleResults = await articlesQueryRepository.search(
			query,
			userId,
			limit,
		);

		const articleSearchResults: ArticleSearchResult[] = articleResults.map(
			(article) => ({
				href: article.url,
				contentType: "articles" as const,
				title: article.title,
				snippet: extractSnippet(
					article.quote || article.ogDescription || article.ogTitle,
					query,
				),
				url: article.url,
				category: { id: "", name: article.categoryName },
			}),
		);

		results.push(...articleSearchResults);
		groups.push({
			contentType: "articles",
			results: articleSearchResults,
			totalCount: articleSearchResults.length,
		});
	}

	// Search books
	if (searchTypes.has("books")) {
		const bookResults = await booksQueryRepository.search(query, userId, limit);

		const bookSearchResults: BookSearchResult[] = bookResults.map((book) => ({
			href: book.isbn,
			contentType: "books" as const,
			title: book.title,
			snippet: extractSnippet(
				book.markdown ??
					book.googleDescription ??
					book.googleSubTitle ??
					book.googleTitle ??
					null,
				query,
			),
			rating: book.rating,
			tags: book.tags,
		}));

		results.push(...bookSearchResults);
		groups.push({
			contentType: "books",
			results: bookSearchResults,
			totalCount: bookSearchResults.length,
		});
	}

	// Search notes
	if (searchTypes.has("notes")) {
		const noteResults = await notesQueryRepository.search(query, userId, limit);

		const noteSearchResults: NoteSearchResult[] = noteResults.map((note) => ({
			href: note.title,
			contentType: "notes" as const,
			title: note.title,
			snippet: extractSnippet(note.markdown, query),
		}));

		results.push(...noteSearchResults);
		groups.push({
			contentType: "notes",
			results: noteSearchResults,
			totalCount: noteSearchResults.length,
		});
	}

	// Sort results by relevance (currently by creation date, but could be enhanced)
	const queryLower = query.toLowerCase();

	results.sort((a, b) => {
		// Simple relevance scoring based on title vs content matches
		const aInTitle = a.title.toLowerCase().includes(queryLower) ? 2 : 0;
		const bInTitle = b.title.toLowerCase().includes(queryLower) ? 2 : 0;
		const aInSnippet = a.snippet.toLowerCase().includes(queryLower) ? 1 : 0;
		const bInSnippet = b.snippet.toLowerCase().includes(queryLower) ? 1 : 0;

		const aScore = aInTitle + aInSnippet;
		const bScore = bInTitle + bInSnippet;

		return bScore - aScore;
	});

	return {
		results: results.slice(0, limit),
		groups,
		totalCount: results.length,
		query,
	};
}

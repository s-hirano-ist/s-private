"use server";
import "server-only";
import type { UserId } from "@/domains/common/entities/common-entity";
import type {
	ContentType,
	SearchQuery,
	SearchResult,
	SearchResultGroup,
	UnifiedSearchResults,
} from "@/domains/common/types/search-types";
import { articlesQueryRepository } from "@/infrastructures/articles/repositories/articles-query-repository";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";
import { notesQueryRepository } from "@/infrastructures/notes/repositories/notes-query-repository";

function truncateText(text: string, maxLength = 150): string {
	if (text.length <= maxLength) return text;
	return `${text.substring(0, maxLength)}...`;
}

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

export async function searchContent(
	searchQuery: SearchQuery,
	userId: UserId,
): Promise<UnifiedSearchResults> {
	const { query, contentTypes, limit = 20 } = searchQuery;
	const searchTypes = contentTypes ?? ["articles", "books", "notes"];

	const results: SearchResult[] = [];
	const groups: SearchResultGroup[] = [];

	// Search articles
	if (searchTypes.includes("articles")) {
		const articleResults = await articlesQueryRepository.search(
			query,
			userId,
			limit,
		);

		const articleSearchResults: SearchResult[] = articleResults.map(
			(article) => ({
				href: article.url,
				contentType: "articles" as ContentType,
				title: article.title,
				snippet: extractSnippet(
					article.quote || article.ogDescription || article.ogTitle,
					query,
				),
				url: article.url,
				category: article.Category,
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
	if (searchTypes.includes("books")) {
		const bookResults = await booksQueryRepository.search(query, userId, limit);

		const bookSearchResults: SearchResult[] = bookResults.map((book) => ({
			href: book.ISBN,
			contentType: "books" as ContentType,
			title: book.title,
			snippet: extractSnippet(
				book.markdown ||
					book.googleDescription ||
					book.googleSubTitle ||
					book.googleTitle,
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
	if (searchTypes.includes("notes")) {
		const noteResults = await notesQueryRepository.search(query, userId, limit);

		const noteSearchResults: SearchResult[] = noteResults.map((note) => ({
			href: note.title,
			contentType: "notes" as ContentType,
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
	results.sort((a, b) => {
		// Simple relevance scoring based on title vs content matches
		const aInTitle = a.title.toLowerCase().includes(query.toLowerCase())
			? 2
			: 0;
		const bInTitle = b.title.toLowerCase().includes(query.toLowerCase())
			? 2
			: 0;
		const aInSnippet = a.snippet.toLowerCase().includes(query.toLowerCase())
			? 1
			: 0;
		const bInSnippet = b.snippet.toLowerCase().includes(query.toLowerCase())
			? 1
			: 0;

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

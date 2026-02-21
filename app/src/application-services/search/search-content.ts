/**
 * Unified search application service.
 *
 * @remarks
 * Provides vector search across articles, books, and notes
 * via the search-api (Qdrant backend).
 *
 * @module
 */

"use server";
import "server-only";
import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import type {
	ArticleSearchResult,
	BookSearchResult,
	ContentType,
	NoteSearchResult,
	SearchQuery,
	SearchResult,
	SearchResultGroup,
	UnifiedSearchResults,
} from "@s-hirano-ist/s-core/shared-kernel/types/search-types";
import { searchVectors } from "@/infrastructures/search/search-service";

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
 * Extracts ISBN from a book doc_id.
 *
 * @example extractBookISBN("file:markdown/book/9784003362211.md") → "9784003362211"
 * @internal
 */
function extractBookISBN(docId: string): string | undefined {
	const match = docId.match(/\/book\/([^/]+)\.md$/);
	return match?.[1];
}

/**
 * Performs unified search across all content types via search-api.
 *
 * @remarks
 * Searches articles, books, and notes through the Qdrant vector search backend.
 * Results are sorted by relevance score from the search-api.
 *
 * @param searchQuery - Search query with optional filters
 * @param _userId - User ID (reserved for future per-user filtering)
 * @returns Unified search results grouped by content type
 */
export async function searchContent(
	searchQuery: SearchQuery,
	_userId: UserId,
): Promise<UnifiedSearchResults> {
	const { query, contentTypes, limit = 20 } = searchQuery;
	const searchTypes = new Set(contentTypes ?? ["articles", "books", "notes"]);

	const data = await searchVectors(query, {
		topK: limit,
		contentType: contentTypes,
	});

	const results: SearchResult[] = [];
	const groupMap = new Map<ContentType, SearchResult[]>();

	for (const r of data.results) {
		const ct = r.content_type;

		if (!searchTypes.has(ct)) continue;

		let result: SearchResult;
		if (ct === "articles") {
			result = {
				href: r.url ?? "",
				contentType: "articles" as const,
				title: r.title,
				snippet: truncateText(r.text),
				url: r.url ?? "",
				category: { id: "", name: r.heading_path[0] ?? "" },
			} satisfies ArticleSearchResult;
		} else if (ct === "books") {
			const isbn = extractBookISBN(r.doc_id);
			result = {
				href: isbn ?? encodeURIComponent(r.title),
				contentType: "books" as const,
				title: r.title,
				snippet: truncateText(r.text),
				rating: null,
				tags: [],
			} satisfies BookSearchResult;
		} else {
			result = {
				href: encodeURIComponent(r.heading_path[0] ?? r.title),
				contentType: "notes" as const,
				title: r.title,
				snippet: truncateText(r.text),
			} satisfies NoteSearchResult;
		}

		results.push(result);

		const group = groupMap.get(ct) ?? [];
		group.push(result);
		groupMap.set(ct, group);
	}

	const groups: SearchResultGroup[] = [];
	for (const ct of ["articles", "books", "notes"] as const) {
		const groupResults = groupMap.get(ct);
		if (groupResults) {
			groups.push({
				contentType: ct,
				results: groupResults,
				totalCount: groupResults.length,
			});
		}
	}

	return {
		results: results.slice(0, limit),
		groups,
		totalCount: results.length,
		query,
	};
}

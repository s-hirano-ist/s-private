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
import { env } from "@/env";

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
 * Maps search-api type + doc_id to a ContentType.
 *
 * @internal
 */
function resolveContentType(
	type: "markdown_note" | "bookmark_json",
	docId: string,
): ContentType {
	if (type === "bookmark_json") return "articles";
	return docId.includes("/book/") ? "books" : "notes";
}

/**
 * Builds the search-api `type` filter from contentTypes.
 *
 * @internal
 */
function buildTypeFilter(
	contentTypes: ContentType[],
): "bookmark_json" | "markdown_note" | undefined {
	const hasArticles = contentTypes.includes("articles");
	const hasBooks = contentTypes.includes("books");
	const hasNotes = contentTypes.includes("notes");

	if (hasArticles && !hasBooks && !hasNotes) return "bookmark_json";
	if (!hasArticles && (hasBooks || hasNotes)) return "markdown_note";
	return undefined;
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

	const typeFilter = contentTypes ? buildTypeFilter(contentTypes) : undefined;

	const response = await fetch(`${env.SEARCH_API_URL}/search`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${env.SEARCH_API_KEY}`,
		},
		body: JSON.stringify({
			query,
			topK: limit,
			...(typeFilter ? { type: typeFilter } : {}),
		}),
	});

	if (!response.ok) {
		throw new Error(`Search API returned ${response.status}`);
	}

	const data = (await response.json()) as {
		results: Array<{
			title: string;
			text: string;
			url?: string;
			type: "markdown_note" | "bookmark_json";
			heading_path: string[];
			doc_id: string;
			score?: number;
		}>;
	};

	const results: SearchResult[] = [];
	const groupMap = new Map<ContentType, SearchResult[]>();

	for (const r of data.results) {
		const ct = resolveContentType(r.type, r.doc_id);

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
			result = {
				href: r.title,
				contentType: "books" as const,
				title: r.title,
				snippet: truncateText(r.text),
				rating: null,
				tags: [],
			} satisfies BookSearchResult;
		} else {
			result = {
				href: r.title,
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

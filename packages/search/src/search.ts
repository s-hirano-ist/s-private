import type { SearchResult } from "./config";
import { embed } from "./embedding";
import { search } from "./qdrant-client";

export type SearchOptions = {
	topK?: number;
	type?: "markdown_note" | "bookmark_json";
	heading?: string;
};

export type SearchResponse = {
	results: SearchResult[];
	query: string;
	totalResults: number;
};

/**
 * High-level search: embed query → vector search → return results
 */
export async function searchContent(
	query: string,
	options: SearchOptions = {},
): Promise<SearchResponse> {
	const { topK, type, heading } = options;

	const queryVector = await embed(query, true);
	const results = await search(queryVector, {
		topK,
		filter: { type, top_heading: heading },
	});

	return {
		results,
		query,
		totalResults: results.length,
	};
}

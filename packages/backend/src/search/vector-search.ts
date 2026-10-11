import type { ContentType, SearchResult } from "@s-hirano-ist/s-search/config";
import { getQdrantClient, search } from "@s-hirano-ist/s-search/qdrant-client";

export type SearchOptions = {
	contentType?: ContentType | ContentType[];
	heading?: string;
	topK?: number;
	type?: "markdown_note" | "bookmark_json";
};

export function createVectorSearch(
	config: Parameters<typeof getQdrantClient>[0],
) {
	getQdrantClient(config);
	return async function searchVectors(
		query: string,
		options: SearchOptions = {},
	): Promise<{ query: string; results: SearchResult[]; totalResults: number }> {
		const results = await search(query, {
			topK: options.topK,
			filter: {
				type: options.type,
				top_heading: options.heading,
				content_type: options.contentType,
			},
		});
		return { results, query, totalResults: results.length };
	};
}

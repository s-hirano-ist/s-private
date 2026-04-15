import type { ContentType, SearchResult } from "@s-hirano-ist/s-search/config";
import { getQdrantClient, search } from "@s-hirano-ist/s-search/qdrant-client";
import { env } from "@/env";

// Initialize Qdrant client with env config
getQdrantClient({ url: env.QDRANT_URL, apiKey: env.QDRANT_API_KEY });

export type SearchOptions = {
	topK?: number;
	type?: "markdown_note" | "bookmark_json";
	heading?: string;
	contentType?: ContentType | ContentType[];
};

export async function searchVectors(
	query: string,
	options: SearchOptions = {},
): Promise<{ results: SearchResult[]; query: string; totalResults: number }> {
	const results = await search(query, {
		topK: options.topK,
		filter: {
			type: options.type,
			top_heading: options.heading,
			content_type: options.contentType,
		},
	});
	return { results, query, totalResults: results.length };
}

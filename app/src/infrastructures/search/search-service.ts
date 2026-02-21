import type { ContentType, SearchResult } from "@s-hirano-ist/s-search/config";
import { createEmbeddingClient } from "@s-hirano-ist/s-search/embedding-client";
import { getQdrantClient, search } from "@s-hirano-ist/s-search/qdrant-client";
import { env } from "@/env";

// Initialize Qdrant client with env config
getQdrantClient({ url: env.QDRANT_URL, apiKey: env.QDRANT_API_KEY });

const embeddingClient = createEmbeddingClient({
	apiUrl: env.EMBEDDING_API_URL,
	cfAccessClientId: env.CF_ACCESS_CLIENT_ID,
	cfAccessClientSecret: env.CF_ACCESS_CLIENT_SECRET,
});

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
	const queryVector = await embeddingClient.embed(query, true);
	const results = await search(queryVector, {
		topK: options.topK,
		filter: {
			type: options.type,
			top_heading: options.heading,
			content_type: options.contentType,
		},
	});
	return { results, query, totalResults: results.length };
}

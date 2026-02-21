// RAG Configuration

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} environment variable is required`);
	return value;
}

export const RAG_CONFIG = {
	qdrant: {
		collectionName: requireEnv("QDRANT_COLLECTION_NAME"),
		vectorSize: Number(requireEnv("EMBEDDING_VECTOR_SIZE")),
		distance: "Cosine" as const,
	},
	embedding: {
		model: requireEnv("EMBEDDING_MODEL"),
		prefix: {
			query: requireEnv("EMBEDDING_QUERY_PREFIX"),
			passage: requireEnv("EMBEDDING_PASSAGE_PREFIX"),
		},
	},
	chunking: { maxChunkLength: 2000, headingLevels: [2, 3] },
} as const;

// Content type for distinguishing articles, books, and notes
export type ContentType = "articles" | "books" | "notes";

// Payload type for Qdrant
export type QdrantPayload = {
	type: "markdown_note" | "bookmark_json";
	content_type: ContentType;
	top_heading: string;
	doc_id: string;
	chunk_id: string;
	title: string;
	url?: string;
	heading_path: string[];
	text: string;
	content_hash: string;
};

// Search result type
export type SearchResult = {
	score: number;
	text: string;
	title: string;
	url?: string;
	heading_path: string[];
	type: "markdown_note" | "bookmark_json";
	content_type: ContentType;
	doc_id: string;
};

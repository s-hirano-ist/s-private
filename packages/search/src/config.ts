// RAG Configuration
export const RAG_CONFIG = {
	qdrant: {
		collectionName: process.env.QDRANT_COLLECTION_NAME ?? "knowledge_v2",
		vectorSize: Number(process.env.EMBEDDING_VECTOR_SIZE ?? 1024),
		distance: "Cosine" as const,
	},
	embedding: {
		model: process.env.EMBEDDING_MODEL ?? "intfloat/multilingual-e5-large",
		prefix: {
			query: process.env.EMBEDDING_QUERY_PREFIX ?? "query: ",
			passage: process.env.EMBEDDING_PASSAGE_PREFIX ?? "passage: ",
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

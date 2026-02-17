// RAG Configuration
export const RAG_CONFIG = {
	// Qdrant settings
	qdrant: {
		collectionName: "knowledge_v2",
		vectorSize: 1024, // multilingual-e5-large
		distance: "Cosine" as const,
	},

	// Embedding settings
	embedding: {
		model: "intfloat/multilingual-e5-large",
		prefix: {
			query: "query: ",
			passage: "passage: ",
		},
	},

	// Chunking settings
	chunking: {
		maxChunkLength: 2000,
		headingLevels: [2, 3],
	},
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

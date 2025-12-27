// RAG Configuration
export const RAG_CONFIG = {
	// Qdrant settings
	qdrant: {
		collectionName: "knowledge_v1",
		vectorSize: 384, // multilingual-e5-small
		distance: "Cosine" as const,
	},

	// Embedding settings
	embedding: {
		model: "intfloat/multilingual-e5-small",
		prefix: {
			query: "query: ",
			passage: "passage: ",
		},
	},

	// File paths
	paths: {
		markdown: [
			"markdown/note/**/*.md",
			"markdown/book/**/*.md",
			"raw/article/**/*.md",
		],
		json: "json/article/**/*.json",
	},

	// Chunking settings
	chunking: {
		maxChunkLength: 2000,
		headingLevels: [2, 3], // ## and ###
	},

	// Cache file for hash comparison
	hashCachePath: ".rag-hash-cache.json",
} as const;

// Payload type for Qdrant
export type QdrantPayload = {
	type: "markdown_note" | "bookmark_json";
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
	doc_id: string;
};

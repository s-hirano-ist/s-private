export type ContentType = "articles" | "books" | "notes";

export type SearchResult = {
	id: string;
	contentType: ContentType;
	title: string;
	snippet: string;
	url?: string; // For articles
	rating?: number | null; // For books
	tags?: string[]; // For books
	category?: { id: string; name: string }; // For articles
};

export type SearchQuery = {
	query: string;
	contentTypes?: ContentType[];
	limit?: number;
};

export type SearchResultGroup = {
	contentType: ContentType;
	results: SearchResult[];
	totalCount: number;
};

export type UnifiedSearchResults = {
	results: SearchResult[];
	groups: SearchResultGroup[];
	totalCount: number;
	query: string;
};

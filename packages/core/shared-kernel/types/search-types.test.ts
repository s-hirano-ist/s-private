import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import {
	type ArticleSearchResult,
	type BookSearchResult,
	isArticleSearchResult,
	isBookSearchResult,
	isNoteSearchResult,
	type NoteSearchResult,
	type SearchResult,
	searchQuerySchema,
} from "./search-types.ts";

const articleResult: ArticleSearchResult = {
	href: "/articles/123",
	contentType: "articles",
	title: "Test Article",
	snippet: "A snippet",
	url: "https://example.com",
	category: { id: "tech", name: "Technology" },
};

const bookResult: BookSearchResult = {
	href: "/books/456",
	contentType: "books",
	title: "Test Book",
	snippet: "A snippet",
	rating: 5,
	tags: ["programming"],
};

const noteResult: NoteSearchResult = {
	href: "/notes/789",
	contentType: "notes",
	title: "Test Note",
	snippet: "A snippet",
};

describe("type guards", () => {
	describe("isArticleSearchResult", () => {
		test("should return true for article search result", () => {
			expect(isArticleSearchResult(articleResult)).toBe(true);
		});

		test("should return false for book search result", () => {
			expect(isArticleSearchResult(bookResult as SearchResult)).toBe(false);
		});

		test("should return false for note search result", () => {
			expect(isArticleSearchResult(noteResult as SearchResult)).toBe(false);
		});
	});

	describe("isBookSearchResult", () => {
		test("should return true for book search result", () => {
			expect(isBookSearchResult(bookResult)).toBe(true);
		});

		test("should return false for article search result", () => {
			expect(isBookSearchResult(articleResult as SearchResult)).toBe(false);
		});

		test("should return false for note search result", () => {
			expect(isBookSearchResult(noteResult as SearchResult)).toBe(false);
		});
	});

	describe("isNoteSearchResult", () => {
		test("should return true for note search result", () => {
			expect(isNoteSearchResult(noteResult)).toBe(true);
		});

		test("should return false for article search result", () => {
			expect(isNoteSearchResult(articleResult as SearchResult)).toBe(false);
		});

		test("should return false for book search result", () => {
			expect(isNoteSearchResult(bookResult as SearchResult)).toBe(false);
		});
	});
});

describe("searchQuerySchema", () => {
	test("should accept valid query", () => {
		const result = searchQuerySchema.parse({ query: "typescript" });
		expect(result.query).toBe("typescript");
		expect(result.limit).toBe(20);
	});

	test("should throw error for empty query", () => {
		expect(() => searchQuerySchema.parse({ query: "" })).toThrow(ZodError);
	});

	test("should throw error for query exceeding 256 characters", () => {
		expect(() => searchQuerySchema.parse({ query: "a".repeat(257) })).toThrow(
			ZodError,
		);
	});

	test("should accept query at maximum length (256)", () => {
		const result = searchQuerySchema.parse({ query: "a".repeat(256) });
		expect(result.query).toBe("a".repeat(256));
	});

	test("should default limit to 20", () => {
		const result = searchQuerySchema.parse({ query: "test" });
		expect(result.limit).toBe(20);
	});

	test("should accept custom limit", () => {
		const result = searchQuerySchema.parse({ query: "test", limit: 50 });
		expect(result.limit).toBe(50);
	});

	test("should accept limit of 1 (minimum)", () => {
		const result = searchQuerySchema.parse({ query: "test", limit: 1 });
		expect(result.limit).toBe(1);
	});

	test("should accept limit of 100 (maximum)", () => {
		const result = searchQuerySchema.parse({ query: "test", limit: 100 });
		expect(result.limit).toBe(100);
	});

	test("should throw error for limit below 1", () => {
		expect(() => searchQuerySchema.parse({ query: "test", limit: 0 })).toThrow(
			ZodError,
		);
	});

	test("should throw error for limit above 100", () => {
		expect(() =>
			searchQuerySchema.parse({ query: "test", limit: 101 }),
		).toThrow(ZodError);
	});

	test("should accept contentTypes array", () => {
		const result = searchQuerySchema.parse({
			query: "test",
			contentTypes: ["articles", "books"],
		});
		expect(result.contentTypes).toEqual(["articles", "books"]);
	});

	test("should accept optional contentTypes as undefined", () => {
		const result = searchQuerySchema.parse({ query: "test" });
		expect(result.contentTypes).toBeUndefined();
	});
});

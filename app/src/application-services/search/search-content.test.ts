import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/infrastructures/search/search-service", () => ({
	searchVectors: vi.fn(),
}));

describe("search-content", () => {
	let searchContent: typeof import("./search-content").searchContent;
	let searchVectors: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		vi.resetModules();
		const mod = await import("./search-content");
		searchContent = mod.searchContent;
		const searchServiceMod = await import(
			"@/infrastructures/search/search-service"
		);
		searchVectors = searchServiceMod.searchVectors as ReturnType<typeof vi.fn>;
	});

	const userId = "test-user-id" as UserId;

	describe("truncateText (via searchContent)", () => {
		test("should not truncate text under 150 characters", async () => {
			const shortText = "Short text";
			searchVectors.mockResolvedValue({
				results: [
					{
						content_type: "notes",
						title: "Note",
						text: shortText,
						doc_id: "doc1",
						heading_path: [],
					},
				],
				query: "test",
				totalResults: 1,
			});

			const result = await searchContent({ query: "test", limit: 20 }, userId);

			expect(result.results[0].snippet).toBe(shortText);
		});

		test("should truncate text over 150 characters with ellipsis", async () => {
			const longText = "a".repeat(200);
			searchVectors.mockResolvedValue({
				results: [
					{
						content_type: "notes",
						title: "Note",
						text: longText,
						doc_id: "doc1",
						heading_path: [],
					},
				],
				query: "test",
				totalResults: 1,
			});

			const result = await searchContent({ query: "test", limit: 20 }, userId);

			expect(result.results[0].snippet).toBe(`${"a".repeat(150)}...`);
		});
	});

	describe("extractBookISBN (via searchContent)", () => {
		test("should extract ISBN from book doc_id", async () => {
			searchVectors.mockResolvedValue({
				results: [
					{
						content_type: "books",
						title: "Test Book",
						text: "Book content",
						doc_id: "file:markdown/book/9784003362211.md",
						heading_path: [],
					},
				],
				query: "test",
				totalResults: 1,
			});

			const result = await searchContent({ query: "test", limit: 20 }, userId);

			expect(result.results[0].href).toBe("9784003362211");
		});

		test("should use encoded title when doc_id does not match ISBN pattern", async () => {
			searchVectors.mockResolvedValue({
				results: [
					{
						content_type: "books",
						title: "Test Book",
						text: "Book content",
						doc_id: "invalid-doc-id",
						heading_path: [],
					},
				],
				query: "test",
				totalResults: 1,
			});

			const result = await searchContent({ query: "test", limit: 20 }, userId);

			expect(result.results[0].href).toBe(encodeURIComponent("Test Book"));
		});
	});

	describe("searchContent", () => {
		test("should map article results correctly", async () => {
			searchVectors.mockResolvedValue({
				results: [
					{
						content_type: "articles",
						title: "Article Title",
						text: "Article content",
						url: "https://example.com",
						doc_id: "doc1",
						heading_path: ["Technology"],
					},
				],
				query: "test",
				totalResults: 1,
			});

			const result = await searchContent({ query: "test", limit: 20 }, userId);

			expect(result.results[0]).toEqual({
				href: "https://example.com",
				contentType: "articles",
				title: "Article Title",
				snippet: "Article content",
				url: "https://example.com",
				category: { id: "", name: "Technology" },
			});
		});

		test("should map book results correctly", async () => {
			searchVectors.mockResolvedValue({
				results: [
					{
						content_type: "books",
						title: "Book Title",
						text: "Book content",
						doc_id: "file:markdown/book/1234567890.md",
						heading_path: [],
					},
				],
				query: "test",
				totalResults: 1,
			});

			const result = await searchContent({ query: "test", limit: 20 }, userId);

			expect(result.results[0]).toEqual({
				href: "1234567890",
				contentType: "books",
				title: "Book Title",
				snippet: "Book content",
				rating: null,
				tags: [],
			});
		});

		test("should map note results correctly", async () => {
			searchVectors.mockResolvedValue({
				results: [
					{
						content_type: "notes",
						title: "Note Title",
						text: "Note content",
						doc_id: "doc1",
						heading_path: [],
					},
				],
				query: "test",
				totalResults: 1,
			});

			const result = await searchContent({ query: "test", limit: 20 }, userId);

			expect(result.results[0]).toEqual({
				href: encodeURIComponent("Note Title"),
				contentType: "notes",
				title: "Note Title",
				snippet: "Note content",
			});
		});

		test("should filter results by contentTypes", async () => {
			searchVectors.mockResolvedValue({
				results: [
					{
						content_type: "articles",
						title: "Article",
						text: "content",
						url: "https://example.com",
						doc_id: "doc1",
						heading_path: ["Tech"],
					},
					{
						content_type: "books",
						title: "Book",
						text: "content",
						doc_id: "doc2",
						heading_path: [],
					},
				],
				query: "test",
				totalResults: 2,
			});

			const result = await searchContent(
				{ query: "test", contentTypes: ["articles"], limit: 20 },
				userId,
			);

			expect(result.results).toHaveLength(1);
			expect(result.results[0].contentType).toBe("articles");
		});

		test("should limit results", async () => {
			const manyResults = Array.from({ length: 5 }, (_, i) => ({
				content_type: "notes" as const,
				title: `Note ${i}`,
				text: `Content ${i}`,
				doc_id: `doc${i}`,
				heading_path: [],
			}));

			searchVectors.mockResolvedValue({
				results: manyResults,
				query: "test",
				totalResults: 5,
			});

			const result = await searchContent({ query: "test", limit: 2 }, userId);

			expect(result.results).toHaveLength(2);
		});

		test("should build groups by content type", async () => {
			searchVectors.mockResolvedValue({
				results: [
					{
						content_type: "articles",
						title: "Article 1",
						text: "content",
						url: "https://example.com",
						doc_id: "doc1",
						heading_path: ["Tech"],
					},
					{
						content_type: "articles",
						title: "Article 2",
						text: "content",
						url: "https://example2.com",
						doc_id: "doc2",
						heading_path: ["Science"],
					},
					{
						content_type: "notes",
						title: "Note 1",
						text: "content",
						doc_id: "doc3",
						heading_path: [],
					},
				],
				query: "test",
				totalResults: 3,
			});

			const result = await searchContent({ query: "test", limit: 20 }, userId);

			expect(result.groups).toHaveLength(2);
			expect(result.groups[0].contentType).toBe("articles");
			expect(result.groups[0].results).toHaveLength(2);
			expect(result.groups[0].totalCount).toBe(2);
			expect(result.groups[1].contentType).toBe("notes");
			expect(result.groups[1].results).toHaveLength(1);
		});

		test("should return totalCount and query", async () => {
			searchVectors.mockResolvedValue({
				results: [
					{
						content_type: "notes",
						title: "Note",
						text: "content",
						doc_id: "doc1",
						heading_path: [],
					},
				],
				query: "typescript",
				totalResults: 1,
			});

			const result = await searchContent(
				{ query: "typescript", limit: 20 },
				userId,
			);

			expect(result.totalCount).toBe(1);
			expect(result.query).toBe("typescript");
		});

		test("should return empty results when no matches", async () => {
			searchVectors.mockResolvedValue({
				results: [],
				query: "nonexistent",
				totalResults: 0,
			});

			const result = await searchContent(
				{ query: "nonexistent", limit: 20 },
				userId,
			);

			expect(result.results).toHaveLength(0);
			expect(result.groups).toHaveLength(0);
			expect(result.totalCount).toBe(0);
		});
	});
});

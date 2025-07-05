import { beforeEach, describe, expect, it, vi } from "vitest";
import { getKnowledgeItemById, searchKnowledge } from "./ai-search";
import { fetchAllKnowledge } from "./fetch-knowledge";

vi.mock("./fetch-knowledge", () => ({
	fetchAllKnowledge: vi.fn(),
}));

const mockKnowledgeBase = [
	{
		id: "content-test-1",
		title: "React Testing Best Practices",
		content:
			"React testing is important for maintaining code quality. Unit tests help catch bugs early.",
		type: "content" as const,
	},
	{
		id: "book-test-1",
		title: "JavaScript Design Patterns",
		content:
			"Design patterns are reusable solutions to commonly occurring problems in software design.",
		type: "book" as const,
	},
	{
		id: "content-test-2",
		title: "TypeScript Advanced Features",
		content:
			"TypeScript provides advanced type features like generics, conditional types, and mapped types.",
		type: "content" as const,
	},
];

describe("ai-search", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("searchKnowledge", () => {
		it("should return empty array for empty query", async () => {
			const result = await searchKnowledge("");
			expect(result).toEqual([]);
		});

		it("should return empty array for whitespace-only query", async () => {
			const result = await searchKnowledge("   ");
			expect(result).toEqual([]);
		});

		it("should search by title and return relevant results", async () => {
			vi.mocked(fetchAllKnowledge).mockResolvedValue(mockKnowledgeBase);

			const result = await searchKnowledge("React");

			expect(result).toHaveLength(1);
			expect(result[0].title).toBe("React Testing Best Practices");
			expect(result[0].relevanceScore).toBeGreaterThan(0);
			expect(result[0].aiSummary).toContain("React testing is important");
		});

		it("should search by content and return relevant results", async () => {
			vi.mocked(fetchAllKnowledge).mockResolvedValue(mockKnowledgeBase);

			const result = await searchKnowledge("design patterns");

			expect(result).toHaveLength(1);
			expect(result[0].title).toBe("JavaScript Design Patterns");
			expect(result[0].relevanceScore).toBeGreaterThan(0);
		});

		it("should calculate relevance score correctly", async () => {
			vi.mocked(fetchAllKnowledge).mockResolvedValue(mockKnowledgeBase);

			const result = await searchKnowledge("TypeScript");

			expect(result).toHaveLength(1);
			expect(result[0].relevanceScore).toBe(4); // 1 title match * 3 + 1 content match = 4
		});

		it("should sort results by relevance score", async () => {
			const multiMatchKnowledge = [
				{
					id: "content-1",
					title: "TypeScript Basics",
					content: "TypeScript is a typed superset of JavaScript.",
					type: "content" as const,
				},
				{
					id: "content-2",
					title: "Advanced JavaScript",
					content: "TypeScript TypeScript TypeScript provides better tooling.",
					type: "content" as const,
				},
			];

			vi.mocked(fetchAllKnowledge).mockResolvedValue(multiMatchKnowledge);

			const result = await searchKnowledge("TypeScript");

			expect(result).toHaveLength(2);
			expect(result[0].relevanceScore).toBeGreaterThan(
				result[1].relevanceScore,
			);
		});

		it("should create AI summary with context around query", async () => {
			const longContentKnowledge = [
				{
					id: "content-1",
					title: "Long Article",
					content: "A".repeat(150) + " testing " + "B".repeat(150),
					type: "content" as const,
				},
			];

			vi.mocked(fetchAllKnowledge).mockResolvedValue(longContentKnowledge);

			const result = await searchKnowledge("testing");

			expect(result).toHaveLength(1);
			expect(result[0].aiSummary).toContain("testing");
			expect(result[0].aiSummary).toContain("...");
		});

		it("should handle case insensitive search", async () => {
			vi.mocked(fetchAllKnowledge).mockResolvedValue(mockKnowledgeBase);

			const result = await searchKnowledge("REACT");

			expect(result).toHaveLength(1);
			expect(result[0].title).toBe("React Testing Best Practices");
		});

		it("should return empty array when no matches found", async () => {
			vi.mocked(fetchAllKnowledge).mockResolvedValue(mockKnowledgeBase);

			const result = await searchKnowledge("nonexistent");

			expect(result).toEqual([]);
		});

		it("should handle errors gracefully", async () => {
			vi.mocked(fetchAllKnowledge).mockRejectedValue(
				new Error("Database error"),
			);

			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			const result = await searchKnowledge("test");

			expect(result).toEqual([]);
			expect(consoleSpy).toHaveBeenCalledWith(
				"Error searching knowledge:",
				expect.any(Error),
			);

			consoleSpy.mockRestore();
		});

		it("should create fallback summary when no direct match in content", async () => {
			const knowledgeWithTitleMatch = [
				{
					id: "content-1",
					title: "React Components",
					content:
						"This content talks about components but doesn't mention the R word directly.",
					type: "content" as const,
				},
			];

			vi.mocked(fetchAllKnowledge).mockResolvedValue(knowledgeWithTitleMatch);

			const result = await searchKnowledge("React");

			expect(result).toHaveLength(1);
			expect(result[0].aiSummary).toContain(
				"This content talks about components",
			);
			expect(result[0].aiSummary).toContain("...");
		});
	});

	describe("getKnowledgeItemById", () => {
		it("should return item by ID", async () => {
			vi.mocked(fetchAllKnowledge).mockResolvedValue(mockKnowledgeBase);

			const result = await getKnowledgeItemById("content-test-1");

			expect(result).toEqual(mockKnowledgeBase[0]);
		});

		it("should return undefined for non-existent ID", async () => {
			vi.mocked(fetchAllKnowledge).mockResolvedValue(mockKnowledgeBase);

			const result = await getKnowledgeItemById("nonexistent-id");

			expect(result).toBeUndefined();
		});

		it("should handle errors from fetchAllKnowledge", async () => {
			vi.mocked(fetchAllKnowledge).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getKnowledgeItemById("test-id")).rejects.toThrow(
				"Database error",
			);
		});
	});
});

import { beforeEach, describe, expect, test, vi } from "vitest";
import { knowledgeRepository } from "@/features/ai/repositories/knowledge-repository";
import {
	fetchAllKnowledge,
	fetchContentByTitle,
	getAllStaticBooksForKnowledge,
	getAllStaticContentsForKnowledge,
} from "./fetch-knowledge";

vi.mock("@/features/ai/repositories/knowledge-repository", () => ({
	knowledgeRepository: {
		findAllStaticContents: vi.fn(),
		findAllStaticBooks: vi.fn(),
		findStaticContentByTitle: vi.fn(),
	},
}));

describe("fetch-knowledge", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getAllStaticContentsForKnowledge", () => {
		test("should fetch static contents with correct parameters", async () => {
			const mockContents = [
				{ title: "Test Content 1", markdown: "Content 1 markdown" },
				{ title: "Test Content 2", markdown: "Content 2 markdown" },
			];

			vi.mocked(knowledgeRepository.findAllStaticContents).mockResolvedValue(
				mockContents,
			);

			const result = await getAllStaticContentsForKnowledge();

			expect(knowledgeRepository.findAllStaticContents).toHaveBeenCalled();
			expect(result).toEqual(mockContents);
		});

		test("should handle empty results", async () => {
			vi.mocked(knowledgeRepository.findAllStaticContents).mockResolvedValue(
				[],
			);

			const result = await getAllStaticContentsForKnowledge();

			expect(result).toEqual([]);
		});
	});

	describe("getAllStaticBooksForKnowledge", () => {
		test("should fetch static books with correct parameters", async () => {
			const mockBooks = [
				{ title: "Test Book 1", markdown: "Book 1 markdown" },
				{ title: "Test Book 2", markdown: "Book 2 markdown" },
			];

			vi.mocked(knowledgeRepository.findAllStaticBooks).mockResolvedValue(
				mockBooks,
			);

			const result = await getAllStaticBooksForKnowledge();

			expect(knowledgeRepository.findAllStaticBooks).toHaveBeenCalled();
			expect(result).toEqual(mockBooks);
		});

		test("should handle empty results", async () => {
			vi.mocked(knowledgeRepository.findAllStaticBooks).mockResolvedValue([]);

			const result = await getAllStaticBooksForKnowledge();

			expect(result).toEqual([]);
		});
	});

	describe("fetchAllKnowledge", () => {
		test("should combine contents and books with correct format", async () => {
			const mockContents = [
				{
					title: "Content 1",
					markdown: "Content 1 markdown",
				},
				{
					title: "Content 2",
					markdown: "Content 2 markdown",
				},
			];

			const mockBooks = [
				{ title: "Book 1", markdown: "Book 1 markdown", ISBN: "0000000000" },
				{ title: "Book 2", markdown: "Book 2 markdown", ISBN: "0000000001" },
			];

			vi.mocked(knowledgeRepository.findAllStaticContents).mockResolvedValue(
				mockContents,
			);
			vi.mocked(knowledgeRepository.findAllStaticBooks).mockResolvedValue(
				mockBooks,
			);

			const result = await fetchAllKnowledge();

			expect(result).toEqual([
				{
					id: "content-Content 1",
					title: "Content 1",
					content: "Content 1 markdown",
					type: "content",
					href: "/content/Content 1",
				},
				{
					id: "content-Content 2",
					title: "Content 2",
					content: "Content 2 markdown",
					type: "content",
					href: "/content/Content 2",
				},
				{
					id: "book-Book 1",
					title: "Book 1",
					content: "Book 1 markdown",
					type: "book",
					href: "/book/0000000000",
				},
				{
					id: "book-Book 2",
					title: "Book 2",
					content: "Book 2 markdown",
					type: "book",
					href: "/book/0000000001",
				},
			]);
		});

		test("should handle empty contents and books", async () => {
			vi.mocked(knowledgeRepository.findAllStaticContents).mockResolvedValue(
				[],
			);
			vi.mocked(knowledgeRepository.findAllStaticBooks).mockResolvedValue([]);

			const result = await fetchAllKnowledge();

			expect(result).toEqual([]);
		});

		test("should handle only contents", async () => {
			const mockContents = [
				{ title: "Content 1", markdown: "Content 1 markdown" },
			];

			vi.mocked(knowledgeRepository.findAllStaticContents).mockResolvedValue(
				mockContents,
			);
			vi.mocked(knowledgeRepository.findAllStaticBooks).mockResolvedValue([]);

			const result = await fetchAllKnowledge();

			expect(result).toEqual([
				{
					id: "content-Content 1",
					title: "Content 1",
					content: "Content 1 markdown",
					type: "content",
					href: "/content/Content 1",
				},
			]);
		});

		test("should handle only books", async () => {
			const mockBooks = [
				{ title: "Book 1", markdown: "Book 1 markdown", ISBN: "0123456789" },
			];

			vi.mocked(knowledgeRepository.findAllStaticContents).mockResolvedValue(
				[],
			);
			vi.mocked(knowledgeRepository.findAllStaticBooks).mockResolvedValue(
				mockBooks,
			);

			const result = await fetchAllKnowledge();

			expect(result).toEqual([
				{
					id: "book-Book 1",
					title: "Book 1",
					content: "Book 1 markdown",
					type: "book",
					href: "/book/0123456789",
				},
			]);
		});
	});

	describe("fetchContentByTitle", () => {
		test("should fetch content by title with correct parameters", async () => {
			const mockContent = {
				title: "Test Content",
				markdown: "Test markdown content",
				ISBN: "0001111",
			};

			vi.mocked(knowledgeRepository.findStaticContentByTitle).mockResolvedValue(
				mockContent,
			);

			const result = await fetchContentByTitle("Test Content");

			expect(knowledgeRepository.findStaticContentByTitle).toHaveBeenCalledWith(
				"Test Content",
			);
			expect(result).toEqual(mockContent);
		});

		test("should return null for non-existent content", async () => {
			vi.mocked(knowledgeRepository.findStaticContentByTitle).mockResolvedValue(
				null,
			);

			const result = await fetchContentByTitle("Non-existent Content");

			expect(result).toBeNull();
		});

		test("should handle database errors", async () => {
			vi.mocked(knowledgeRepository.findStaticContentByTitle).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(fetchContentByTitle("Test Content")).rejects.toThrow(
				"Database error",
			);
		});
	});
});

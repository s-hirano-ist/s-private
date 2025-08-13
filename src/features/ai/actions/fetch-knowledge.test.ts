import { beforeEach, describe, expect, test, vi } from "vitest";
import { knowledgeQueryRepository } from "@/features/ai/repositories/knowledge-query-repository";
import {
	fetchAllKnowledge,
	getAllBooksForKnowledge,
	getAllContentsForKnowledge,
} from "./fetch-knowledge";

vi.mock("@/features/ai/repositories/knowledge-query-repository", () => ({
	knowledgeQueryRepository: {
		findAllContents: vi.fn(),
		findAllBooks: vi.fn(),
	},
}));

describe("fetch-knowledge", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getAllContentsForKnowledge", () => {
		test("should fetch contents with correct parameters", async () => {
			const mockContents = [
				{ title: "Test Content 1", markdown: "Content 1 markdown" },
				{ title: "Test Content 2", markdown: "Content 2 markdown" },
			];

			vi.mocked(knowledgeQueryRepository.findAllContents).mockResolvedValue(
				mockContents,
			);

			const result = await getAllContentsForKnowledge();

			expect(knowledgeQueryRepository.findAllContents).toHaveBeenCalled();
			expect(result).toEqual(mockContents);
		});

		test("should handle empty results", async () => {
			vi.mocked(knowledgeQueryRepository.findAllContents).mockResolvedValue([]);

			const result = await getAllContentsForKnowledge();

			expect(result).toEqual([]);
		});
	});

	describe("getAllBooksForKnowledge", () => {
		test("should fetch books with correct parameters", async () => {
			const mockBooks = [
				{ title: "Test Book 1", markdown: "Book 1 markdown" },
				{ title: "Test Book 2", markdown: "Book 2 markdown" },
			];

			vi.mocked(knowledgeQueryRepository.findAllBooks).mockResolvedValue(
				mockBooks,
			);

			const result = await getAllBooksForKnowledge();

			expect(knowledgeQueryRepository.findAllBooks).toHaveBeenCalled();
			expect(result).toEqual(mockBooks);
		});

		test("should handle empty results", async () => {
			vi.mocked(knowledgeQueryRepository.findAllBooks).mockResolvedValue([]);

			const result = await getAllBooksForKnowledge();

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

			vi.mocked(knowledgeQueryRepository.findAllContents).mockResolvedValue(
				mockContents,
			);
			vi.mocked(knowledgeQueryRepository.findAllBooks).mockResolvedValue(
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
			vi.mocked(knowledgeQueryRepository.findAllContents).mockResolvedValue([]);
			vi.mocked(knowledgeQueryRepository.findAllBooks).mockResolvedValue([]);

			const result = await fetchAllKnowledge();

			expect(result).toEqual([]);
		});

		test("should handle only contents", async () => {
			const mockContents = [
				{ title: "Content 1", markdown: "Content 1 markdown" },
			];

			vi.mocked(knowledgeQueryRepository.findAllContents).mockResolvedValue(
				mockContents,
			);
			vi.mocked(knowledgeQueryRepository.findAllBooks).mockResolvedValue([]);

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

			vi.mocked(knowledgeQueryRepository.findAllContents).mockResolvedValue([]);
			vi.mocked(knowledgeQueryRepository.findAllBooks).mockResolvedValue(
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
});

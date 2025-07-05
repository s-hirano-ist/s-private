import { beforeEach, describe, expect, test, vi } from "vitest";
import prisma from "@/prisma";
import {
	fetchAllKnowledge,
	fetchContentByTitle,
	getAllStaticBooksForKnowledge,
	getAllStaticContentsForKnowledge,
} from "./fetch-knowledge";

vi.mock("@/prisma", () => ({
	default: {
		staticContents: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
		},
		staticBooks: {
			findMany: vi.fn(),
		},
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

			vi.mocked(prisma.staticContents.findMany).mockResolvedValue(mockContents);

			const result = await getAllStaticContentsForKnowledge();

			expect(prisma.staticContents.findMany).toHaveBeenCalledWith({
				select: { title: true, markdown: true },
				cacheStrategy: { ttl: 400, tags: ["staticContents"] },
			});
			expect(result).toEqual(mockContents);
		});

		test("should handle empty results", async () => {
			vi.mocked(prisma.staticContents.findMany).mockResolvedValue([]);

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

			vi.mocked(prisma.staticBooks.findMany).mockResolvedValue(mockBooks);

			const result = await getAllStaticBooksForKnowledge();

			expect(prisma.staticBooks.findMany).toHaveBeenCalledWith({
				select: { title: true, markdown: true },
				cacheStrategy: { ttl: 400, tags: ["staticBooks"] },
			});
			expect(result).toEqual(mockBooks);
		});

		test("should handle empty results", async () => {
			vi.mocked(prisma.staticBooks.findMany).mockResolvedValue([]);

			const result = await getAllStaticBooksForKnowledge();

			expect(result).toEqual([]);
		});
	});

	describe("fetchAllKnowledge", () => {
		test("should combine contents and books with correct format", async () => {
			const mockContents = [
				{ title: "Content 1", markdown: "Content 1 markdown" },
				{ title: "Content 2", markdown: "Content 2 markdown" },
			];

			const mockBooks = [
				{ title: "Book 1", markdown: "Book 1 markdown" },
				{ title: "Book 2", markdown: "Book 2 markdown" },
			];

			vi.mocked(prisma.staticContents.findMany).mockResolvedValue(mockContents);
			vi.mocked(prisma.staticBooks.findMany).mockResolvedValue(mockBooks);

			const result = await fetchAllKnowledge();

			expect(result).toEqual([
				{
					id: "content-Content 1",
					title: "Content 1",
					content: "Content 1 markdown",
					type: "content",
				},
				{
					id: "content-Content 2",
					title: "Content 2",
					content: "Content 2 markdown",
					type: "content",
				},
				{
					id: "book-Book 1",
					title: "Book 1",
					content: "Book 1 markdown",
					type: "book",
				},
				{
					id: "book-Book 2",
					title: "Book 2",
					content: "Book 2 markdown",
					type: "book",
				},
			]);
		});

		test("should handle empty contents and books", async () => {
			vi.mocked(prisma.staticContents.findMany).mockResolvedValue([]);
			vi.mocked(prisma.staticBooks.findMany).mockResolvedValue([]);

			const result = await fetchAllKnowledge();

			expect(result).toEqual([]);
		});

		test("should handle only contents", async () => {
			const mockContents = [
				{ title: "Content 1", markdown: "Content 1 markdown" },
			];

			vi.mocked(prisma.staticContents.findMany).mockResolvedValue(mockContents);
			vi.mocked(prisma.staticBooks.findMany).mockResolvedValue([]);

			const result = await fetchAllKnowledge();

			expect(result).toEqual([
				{
					id: "content-Content 1",
					title: "Content 1",
					content: "Content 1 markdown",
					type: "content",
				},
			]);
		});

		test("should handle only books", async () => {
			const mockBooks = [{ title: "Book 1", markdown: "Book 1 markdown" }];

			vi.mocked(prisma.staticContents.findMany).mockResolvedValue([]);
			vi.mocked(prisma.staticBooks.findMany).mockResolvedValue(mockBooks);

			const result = await fetchAllKnowledge();

			expect(result).toEqual([
				{
					id: "book-Book 1",
					title: "Book 1",
					content: "Book 1 markdown",
					type: "book",
				},
			]);
		});
	});

	describe("fetchContentByTitle", () => {
		test("should fetch content by title with correct parameters", async () => {
			const mockContent = {
				title: "Test Content",
				markdown: "Test markdown content",
			};

			vi.mocked(prisma.staticContents.findUnique).mockResolvedValue(
				mockContent,
			);

			const result = await fetchContentByTitle("Test Content");

			expect(prisma.staticContents.findUnique).toHaveBeenCalledWith({
				where: { title: "Test Content" },
				select: { title: true, markdown: true },
				cacheStrategy: { ttl: 400, tags: ["staticContents"] },
			});
			expect(result).toEqual(mockContent);
		});

		test("should return null for non-existent content", async () => {
			vi.mocked(prisma.staticContents.findUnique).mockResolvedValue(null);

			const result = await fetchContentByTitle("Non-existent Content");

			expect(result).toBeNull();
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.staticContents.findUnique).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(fetchContentByTitle("Test Content")).rejects.toThrow(
				"Database error",
			);
		});
	});
});

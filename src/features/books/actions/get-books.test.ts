import { beforeEach, describe, expect, test, vi } from "vitest";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";
import { getBooksCount, getExportedBooks } from "./get-books";

vi.mock("@/infrastructures/books/repositories/books-query-repository", () => ({
	booksQueryRepository: {
		findMany: vi.fn(),
		count: vi.fn(),
	},
}));

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn().mockResolvedValue("test-user-id"),
}));

describe("get-books", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getAllBooks", () => {
		test("should fetch and transform books correctly", async () => {
			const mockBooks = [
				{
					title: "Test Book 1",
					ISBN: "978-0123456789",
					googleImgSrc: "https://example.com/image-1.jpg",
				},
				{
					title: "Test Book 2",
					ISBN: "978-0987654321",
					googleImgSrc: "https://example.com/image-2.jpg",
				},
			];

			vi.mocked(booksQueryRepository.findMany).mockResolvedValue(mockBooks);

			const result = await getExportedBooks();

			expect(booksQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
				expect.objectContaining({
					orderBy: { createdAt: "desc" },
					cacheStrategy: { ttl: 400, swr: 40, tags: ["books"] },
				}),
			);

			expect(result).toEqual([
				{
					title: "Test Book 1",
					href: "978-0123456789",
					image: "https://example.com/image-1.jpg",
				},
				{
					title: "Test Book 2",
					href: "978-0987654321",
					image: "https://example.com/image-2.jpg",
				},
			]);
		});

		test("should handle empty results", async () => {
			vi.mocked(booksQueryRepository.findMany).mockResolvedValue([]);

			const result = await getExportedBooks();

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(booksQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getExportedBooks()).rejects.toThrow("Database error");
		});
	});

	describe("getBooksCount", () => {
		test("should return count of books", async () => {
			vi.mocked(booksQueryRepository.count).mockResolvedValue(42);

			const result = await getBooksCount("EXPORTED");

			expect(booksQueryRepository.count).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
			);
			expect(result).toBe(42);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(booksQueryRepository.count).mockResolvedValue(0);

			const result = await getBooksCount("EXPORTED");

			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(booksQueryRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getBooksCount("EXPORTED")).rejects.toThrow("Database error");
		});
	});
});

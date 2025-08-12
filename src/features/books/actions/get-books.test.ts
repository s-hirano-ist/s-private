import { beforeEach, describe, expect, test, vi } from "vitest";
import { booksQueryRepository } from "@/features/books/repositories/books-query-repository";
import { getAllBooks, getBooksCount } from "./get-books";

vi.mock("@/features/books/repositories/books-query-repository", () => ({
	booksQueryRepository: {
		findAll: vi.fn(),
		count: vi.fn(),
	},
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
					href: "978-0123456789",
					image: "https://example.com/image-1.jpg",
				},
				{
					title: "Test Book 2",
					href: "978-0987654321",
					image: "https://example.com/image-2.jpg",
				},
			];

			vi.mocked(booksQueryRepository.findAll).mockResolvedValue(mockBooks);

			const result = await getAllBooks();

			expect(booksQueryRepository.findAll).toHaveBeenCalled();

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
			vi.mocked(booksQueryRepository.findAll).mockResolvedValue([]);

			const result = await getAllBooks();

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(booksQueryRepository.findAll).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getAllBooks()).rejects.toThrow("Database error");
		});
	});

	describe("getBooksCount", () => {
		test("should return count of books", async () => {
			vi.mocked(booksQueryRepository.count).mockResolvedValue(42);

			const result = await getBooksCount();

			expect(booksQueryRepository.count).toHaveBeenCalled();
			expect(result).toBe(42);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(booksQueryRepository.count).mockResolvedValue(0);

			const result = await getBooksCount();

			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(booksQueryRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getBooksCount()).rejects.toThrow("Database error");
		});
	});
});

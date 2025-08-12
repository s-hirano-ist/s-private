import { beforeEach, describe, expect, test, vi } from "vitest";
import { booksRepository } from "@/features/books/repositories/books-repository";
import { getAllBooks, getBooksCount } from "./get-books";

vi.mock("@/features/books/repositories/books-repository", () => ({
	booksRepository: {
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

			vi.mocked(booksRepository.findAll).mockResolvedValue(mockBooks);

			const result = await getAllBooks();

			expect(booksRepository.findAll).toHaveBeenCalled();

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
			vi.mocked(booksRepository.findAll).mockResolvedValue([]);

			const result = await getAllBooks();

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(booksRepository.findAll).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getAllBooks()).rejects.toThrow("Database error");
		});
	});

	describe("getBooksCount", () => {
		test("should return count of books", async () => {
			vi.mocked(booksRepository.count).mockResolvedValue(42);

			const result = await getBooksCount();

			expect(booksRepository.count).toHaveBeenCalled();
			expect(result).toBe(42);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(booksRepository.count).mockResolvedValue(0);

			const result = await getBooksCount();

			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(booksRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getBooksCount()).rejects.toThrow("Database error");
		});
	});
});

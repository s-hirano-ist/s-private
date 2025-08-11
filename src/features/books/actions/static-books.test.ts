import { beforeEach, describe, expect, test, vi } from "vitest";
import { staticBooksRepository } from "@/features/books/repositories/static-books-repository";
import { getAllStaticBooks, getStaticBooksCount } from "./static-books";

vi.mock("@/features/books/repositories/static-books-repository", () => ({
	staticBooksRepository: {
		findAll: vi.fn(),
		count: vi.fn(),
	},
}));

describe("static-books", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getAllStaticBooks", () => {
		test("should fetch and transform static books correctly", async () => {
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

			vi.mocked(staticBooksRepository.findAll).mockResolvedValue(mockBooks);

			const result = await getAllStaticBooks();

			expect(staticBooksRepository.findAll).toHaveBeenCalled();

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
			vi.mocked(staticBooksRepository.findAll).mockResolvedValue([]);

			const result = await getAllStaticBooks();

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(staticBooksRepository.findAll).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getAllStaticBooks()).rejects.toThrow("Database error");
		});
	});

	describe("getStaticBooksCount", () => {
		test("should return count of static books", async () => {
			vi.mocked(staticBooksRepository.count).mockResolvedValue(42);

			const result = await getStaticBooksCount();

			expect(staticBooksRepository.count).toHaveBeenCalled();
			expect(result).toBe(42);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(staticBooksRepository.count).mockResolvedValue(0);

			const result = await getStaticBooksCount();

			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(staticBooksRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getStaticBooksCount()).rejects.toThrow("Database error");
		});
	});
});

import { beforeEach, describe, expect, test, vi } from "vitest";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";
import {
	getBookByISBN,
	getBooksCount,
	getExportedBooks,
	getUnexportedBooks,
} from "./get-books";

vi.mock("@/infrastructures/books/repositories/books-query-repository", () => ({
	booksQueryRepository: {
		findMany: vi.fn(),
		count: vi.fn(),
		findByISBN: vi.fn(),
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
			vi.mocked(booksQueryRepository.findMany).mockResolvedValue([
				{
					title: "Test Book 1",
					ISBN: "978-0123456789",
					googleImgSrc: "https://example.com/image-1.jpg",
					id: "1",
				},
				{
					title: "Test Book 2",
					ISBN: "978-0987654321",
					googleImgSrc: "https://example.com/image-2.jpg",
					id: "2",
				},
			]);

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
					id: "1",
					title: "Test Book 1",
					href: "978-0123456789",
					image: "https://example.com/image-1.jpg",
				},
				{
					id: "2",
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
			expect(result).toEqual({ count: 42, pageSize: 24 });
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(booksQueryRepository.count).mockResolvedValue(0);

			const result = await getBooksCount("EXPORTED");

			expect(result).toEqual({ count: 0, pageSize: 24 });
		});

		test("should handle database errors", async () => {
			vi.mocked(booksQueryRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getBooksCount("EXPORTED")).rejects.toThrow("Database error");
		});
	});

	describe("getUnexportedBooks", () => {
		test("should fetch and transform unexported books correctly", async () => {
			vi.mocked(booksQueryRepository.findMany).mockResolvedValue([
				{
					title: "Unexported Book 1",
					ISBN: "978-1111111111",
					googleImgSrc: "https://example.com/unexported-1.jpg",
					id: "3",
				},
				{
					title: "Unexported Book 2",
					ISBN: "978-2222222222",
					googleImgSrc: null,
					id: "4",
				},
			]);

			const result = await getUnexportedBooks();

			expect(booksQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"UNEXPORTED",
				expect.objectContaining({
					orderBy: { createdAt: "desc" },
				}),
			);

			expect(result).toEqual([
				{
					id: "3",
					title: "Unexported Book 1",
					href: "978-1111111111",
					image: "https://example.com/unexported-1.jpg",
				},
				{
					id: "4",
					title: "Unexported Book 2",
					href: "978-2222222222",
					image: "/not-found.png",
				},
			]);
		});

		test("should handle empty unexported results", async () => {
			vi.mocked(booksQueryRepository.findMany).mockResolvedValue([]);

			const result = await getUnexportedBooks();

			expect(result).toEqual([]);
		});

		test("should handle database errors for unexported books", async () => {
			vi.mocked(booksQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getUnexportedBooks()).rejects.toThrow("Database error");
		});
	});

	describe("getBookByISBN", () => {
		test("should fetch book by ISBN successfully", async () => {
			const mockBook = {
				id: "book-1",
				ISBN: "978-0123456789",
				title: "Test Book",
				googleTitle: "Test Book - Google",
				googleImgSrc: "https://example.com/book.jpg",
				markdown: "# Book Content",
			};

			vi.mocked(booksQueryRepository.findByISBN).mockResolvedValue(mockBook);

			const result = await getBookByISBN("978-0123456789");

			expect(booksQueryRepository.findByISBN).toHaveBeenCalledWith(
				"978-0123456789",
				"test-user-id",
			);
			expect(result).toEqual(mockBook);
		});

		test("should return null when book not found", async () => {
			vi.mocked(booksQueryRepository.findByISBN).mockResolvedValue(null);

			const result = await getBookByISBN("978-9999999999");

			expect(booksQueryRepository.findByISBN).toHaveBeenCalledWith(
				"978-9999999999",
				"test-user-id",
			);
			expect(result).toBeNull();
		});

		test("should handle database errors for book lookup", async () => {
			vi.mocked(booksQueryRepository.findByISBN).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getBookByISBN("978-0123456789")).rejects.toThrow(
				"Database error",
			);
		});
	});
});

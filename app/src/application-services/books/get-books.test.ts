import {
	makeBookMarkdown,
	makeBookTitle,
	makeGoogleImgSrc,
	makeGoogleTitle,
	makeISBN,
} from "@s-hirano-ist/s-core/books/entities/book-entity";
import {
	makeCreatedAt,
	makeExportedAt,
	makeId,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";
import {
	getBookByISBN,
	getExportedBooks,
	getExportedBooksCount,
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

	describe("getExportedBooks", () => {
		test("should fetch and transform books correctly", async () => {
			vi.mocked(booksQueryRepository.findMany).mockResolvedValue([
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b"),
					title: makeBookTitle("Test Book 1"),
					isbn: makeISBN("978-0123456789"),
					googleImgSrc: makeGoogleImgSrc("https://example.com/image-1.jpg"),
					imagePath: undefined,
				},
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7c"),
					title: makeBookTitle("Test Book 2"),
					isbn: makeISBN("978-0987654321"),
					googleImgSrc: makeGoogleImgSrc("https://example.com/image-2.jpg"),
					imagePath: undefined,
				},
			]);
			vi.mocked(booksQueryRepository.count).mockResolvedValue(5);

			const result = await getExportedBooks(0);

			expect(booksQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
				expect.objectContaining({
					skip: 0,
					take: 24,
					orderBy: { createdAt: "desc" },
					cacheStrategy: expect.objectContaining({
						ttl: 400,
						swr: 40,
						tags: expect.arrayContaining([
							expect.stringContaining("testuserid_books"),
						]),
					}),
				}),
			);

			expect(result).toEqual({
				data: [
					{
						id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b",
						title: "Test Book 1",
						href: "978-0123456789",
						image: "https://example.com/image-1.jpg",
					},
					{
						id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7c",
						title: "Test Book 2",
						href: "978-0987654321",
						image: "https://example.com/image-2.jpg",
					},
				],
				totalCount: 5,
			});
		});

		test("should handle empty results", async () => {
			vi.mocked(booksQueryRepository.findMany).mockResolvedValue([]);
			vi.mocked(booksQueryRepository.count).mockResolvedValue(0);

			const result = await getExportedBooks(0);

			expect(result).toEqual({
				data: [],
				totalCount: 0,
			});
		});

		test("should handle database errors", async () => {
			vi.mocked(booksQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getExportedBooks(0)).rejects.toThrow("Database error");
		});
	});

	describe("getExportedBooksCount", () => {
		test("should return count of exported books", async () => {
			vi.mocked(booksQueryRepository.count).mockResolvedValue(42);

			const result = await getExportedBooksCount();

			expect(booksQueryRepository.count).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
			);
			expect(result).toEqual(42);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(booksQueryRepository.count).mockResolvedValue(0);

			const result = await getExportedBooksCount();

			expect(result).toEqual(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(booksQueryRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getExportedBooksCount()).rejects.toThrow("Database error");
		});
	});

	describe("getUnexportedBooks", () => {
		test("should fetch and transform unexported books correctly", async () => {
			vi.mocked(booksQueryRepository.findMany).mockResolvedValue([
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7d"),
					title: makeBookTitle("Unexported Book 1"),
					isbn: makeISBN("978-1111111111"),
					googleImgSrc: makeGoogleImgSrc(
						"https://example.com/unexported-1.jpg",
					),
					imagePath: undefined,
				},
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7e"),
					title: makeBookTitle("Unexported Book 2"),
					isbn: makeISBN("978-2222222222"),
					googleImgSrc: undefined,
					imagePath: undefined,
				},
			]);
			vi.mocked(booksQueryRepository.count).mockResolvedValue(2);

			const result = await getUnexportedBooks(0);

			expect(booksQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"UNEXPORTED",
				expect.objectContaining({
					skip: 0,
					take: 24,
					orderBy: { createdAt: "desc" },
				}),
			);

			expect(result).toEqual({
				data: [
					{
						id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7d",
						title: "Unexported Book 1",
						href: "978-1111111111",
						image: "https://example.com/unexported-1.jpg",
					},
					{
						id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7e",
						title: "Unexported Book 2",
						href: "978-2222222222",
						image: null,
					},
				],
				totalCount: 2,
			});
		});

		test("should handle empty unexported results", async () => {
			vi.mocked(booksQueryRepository.findMany).mockResolvedValue([]);
			vi.mocked(booksQueryRepository.count).mockResolvedValue(0);

			const result = await getUnexportedBooks(0);

			expect(result).toEqual({
				data: [],
				totalCount: 0,
			});
		});

		test("should handle database errors for unexported books", async () => {
			vi.mocked(booksQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getUnexportedBooks(0)).rejects.toThrow("Database error");
		});
	});

	describe("getBookByISBN", () => {
		test("should fetch book by ISBN successfully", async () => {
			const mockBook = {
				id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7f"),
				userId: makeUserId("test-user-id"),
				isbn: makeISBN("978-0123456789"),
				title: makeBookTitle("Test Book"),
				status: "EXPORTED" as const,
				createdAt: makeCreatedAt(new Date("2024-01-01")),
				exportedAt: makeExportedAt(new Date("2024-01-02")),
				googleTitle: makeGoogleTitle("Test Book - Google"),
				googleImgSrc: makeGoogleImgSrc("https://example.com/book.jpg"),
				markdown: makeBookMarkdown("# Book Content"),
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

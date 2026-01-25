import {
	makeBookMarkdown,
	makeBookTitle,
	makeGoogleAuthors,
	makeGoogleDescription,
	makeGoogleHref,
	makeGoogleImgSrc,
	makeGoogleSubTitle,
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
import prisma from "@/prisma";
import { booksQueryRepository } from "./books-query-repository";

describe("BooksQueryRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findByISBN", () => {
		test("should find book by ISBN, userId, and status", async () => {
			const mockBook = {
				id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b",
				userId: "user123",
				title: "Test Book",
				ISBN: "978-0123456789",
				googleImgSrc: "https://example.com/image.jpg",
				markdown: "# Test Book Content",
				googleTitle: "Test Google Title",
				googleHref: "https://books.google.com/test",
				googleAuthors: ["Author One", "Author Two"],
				googleDescription: "Test book description",
				googleSubTitle: "Test subtitle",
				imagePath: null,
				status: "EXPORTED",
				createdAt: new Date("2024-01-01"),
				exportedAt: new Date("2024-01-02"),
			};

			vi.mocked(prisma.book.findUnique).mockResolvedValue(mockBook);

			const result = await booksQueryRepository.findByISBN(
				makeISBN("978-0123456789"),
				makeUserId("user123"),
			);

			expect(prisma.book.findUnique).toHaveBeenCalled();
			expect(result).toEqual({
				id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b"),
				userId: makeUserId("user123"),
				ISBN: makeISBN("978-0123456789"),
				title: makeBookTitle("Test Book"),
				googleTitle: makeGoogleTitle("Test Google Title"),
				googleSubTitle: makeGoogleSubTitle("Test subtitle"),
				googleAuthors: makeGoogleAuthors(["Author One", "Author Two"]),
				googleDescription: makeGoogleDescription("Test book description"),
				googleImgSrc: makeGoogleImgSrc("https://example.com/image.jpg"),
				googleHref: makeGoogleHref("https://books.google.com/test"),
				imagePath: undefined,
				markdown: makeBookMarkdown("# Test Book Content"),
				status: "EXPORTED",
				createdAt: makeCreatedAt(new Date("2024-01-01")),
				exportedAt: makeExportedAt(new Date("2024-01-02")),
			});
		});

		test("should return null when book not found", async () => {
			vi.mocked(prisma.book.findUnique).mockResolvedValue(null);

			const result = await booksQueryRepository.findByISBN(
				makeISBN("978-9999999999"),
				makeUserId("user123"),
			);

			expect(prisma.book.findUnique).toHaveBeenCalled();
			expect(result).toBeNull();
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.book.findUnique).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(
				booksQueryRepository.findByISBN(
					makeISBN("978-0123456789"),
					makeUserId("user123"),
				),
			).rejects.toThrow("Database error");

			expect(prisma.book.findUnique).toHaveBeenCalled();
		});
	});

	describe("findMany", () => {
		test("should find multiple books successfully", async () => {
			const mockBooks = [
				{
					id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7c",
					title: "First Book",
					ISBN: "978-0123456789",
					googleImgSrc: "https://example.com/image1.jpg",
					imagePath: null,
				},
				{
					id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7d",
					title: "Second Book",
					ISBN: "978-0987654321",
					googleImgSrc: "https://example.com/image2.jpg",
					imagePath: null,
				},
			];

			vi.mocked(prisma.book.findMany).mockResolvedValue(mockBooks);

			const params = {
				orderBy: { createdAt: "desc" as const },
				take: 10,
				skip: 0,
			};

			const result = await booksQueryRepository.findMany(
				makeUserId("user123"),
				"EXPORTED",
				params,
			);

			expect(prisma.book.findMany).toHaveBeenCalled();
			expect(result).toEqual([
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7c"),
					ISBN: makeISBN("978-0123456789"),
					title: makeBookTitle("First Book"),
					googleImgSrc: makeGoogleImgSrc("https://example.com/image1.jpg"),
					imagePath: undefined,
				},
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7d"),
					ISBN: makeISBN("978-0987654321"),
					title: makeBookTitle("Second Book"),
					googleImgSrc: makeGoogleImgSrc("https://example.com/image2.jpg"),
					imagePath: undefined,
				},
			]);
		});

		test("should handle empty results", async () => {
			vi.mocked(prisma.book.findMany).mockResolvedValue([]);

			const result = await booksQueryRepository.findMany(
				makeUserId("user123"),
				"EXPORTED",
			);

			expect(prisma.book.findMany).toHaveBeenCalled();
			expect(result).toEqual([]);
		});

		test("should work with cache strategy", async () => {
			const mockBooks = [
				{
					id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7e",
					title: "Cached Book",
					ISBN: "978-0123456789",
					googleImgSrc: "https://example.com/image.jpg",
					imagePath: null,
				},
			];

			vi.mocked(prisma.book.findMany).mockResolvedValue(mockBooks);

			const params = {
				cacheStrategy: { ttl: 400, swr: 40, tags: ["books"] },
			};

			const result = await booksQueryRepository.findMany(
				makeUserId("user123"),
				"EXPORTED",
				params,
			);

			expect(prisma.book.findMany).toHaveBeenCalled();
			expect(result).toEqual([
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7e"),
					ISBN: makeISBN("978-0123456789"),
					title: makeBookTitle("Cached Book"),
					googleImgSrc: makeGoogleImgSrc("https://example.com/image.jpg"),
					imagePath: undefined,
				},
			]);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.book.findMany).mockRejectedValue(
				new Error("Database connection error"),
			);

			await expect(
				booksQueryRepository.findMany(makeUserId("user123"), "EXPORTED"),
			).rejects.toThrow("Database connection error");

			expect(prisma.book.findMany).toHaveBeenCalled();
		});
	});

	describe("count", () => {
		test("should return count of books", async () => {
			vi.mocked(prisma.book.count).mockResolvedValue(25);

			const result = await booksQueryRepository.count(
				makeUserId("user123"),
				"EXPORTED",
			);

			expect(prisma.book.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
			});
			expect(result).toBe(25);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(prisma.book.count).mockResolvedValue(0);

			const result = await booksQueryRepository.count(
				makeUserId("user123"),
				"UNEXPORTED",
			);

			expect(prisma.book.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "UNEXPORTED" },
			});
			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.book.count).mockRejectedValue(
				new Error("Database count error"),
			);

			await expect(
				booksQueryRepository.count(makeUserId("user123"), "EXPORTED"),
			).rejects.toThrow("Database count error");

			expect(prisma.book.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
			});
		});
	});
});

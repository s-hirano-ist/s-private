import { makeISBN } from "s-private-domains/books/entities/books-entity";
import { makeUserId } from "s-private-domains/common/entities/common-entity";
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
				title: "Test Book",
				ISBN: "978-0123456789",
				googleImgSrc: "https://example.com/image.jpg",
				markdown: "# Test Book Content",
				googleTitle: "Test Google Title",
				googleHref: "https://books.google.com/test",
				googleAuthors: ["Author One", "Author Two"],
				googleDescription: "Test book description",
				googleSubTitle: "Test subtitle",
			};

			vi.mocked(prisma.book.findUnique).mockResolvedValue(mockBook);

			const result = await booksQueryRepository.findByISBN(
				makeISBN("978-0123456789"),
				makeUserId("user123"),
			);

			expect(prisma.book.findUnique).toHaveBeenCalled();
			expect(result).toEqual(mockBook);
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
					title: "First Book",
					ISBN: "978-0123456789",
					googleImgSrc: "https://example.com/image1.jpg",
				},
				{
					title: "Second Book",
					ISBN: "978-0987654321",
					googleImgSrc: "https://example.com/image2.jpg",
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
			expect(result).toEqual(mockBooks);
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
					title: "Cached Book",
					ISBN: "978-0123456789",
					googleImgSrc: "https://example.com/image.jpg",
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
			expect(result).toEqual(mockBooks);
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

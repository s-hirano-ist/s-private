import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/prisma", () => ({
	default: {
		books: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
		},
	},
}));

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

			vi.mocked(prisma.books.findUnique).mockResolvedValue(mockBook);

			const result = await booksQueryRepository.findByISBN(
				"978-0123456789",
				"user123",
				"EXPORTED",
			);

			expect(prisma.books.findUnique).toHaveBeenCalledWith({
				where: {
					ISBN_userId: { ISBN: "978-0123456789", userId: "user123" },
					status: "EXPORTED",
				},
				select: {
					title: true,
					ISBN: true,
					googleImgSrc: true,
					markdown: true,
					googleTitle: true,
					googleHref: true,
					googleAuthors: true,
					googleDescription: true,
					googleSubTitle: true,
				},
			});
			expect(result).toEqual(mockBook);
		});

		test("should return null when book not found", async () => {
			vi.mocked(prisma.books.findUnique).mockResolvedValue(null);

			const result = await booksQueryRepository.findByISBN(
				"978-9999999999",
				"user123",
				"EXPORTED",
			);

			expect(prisma.books.findUnique).toHaveBeenCalledWith({
				where: {
					ISBN_userId: { ISBN: "978-9999999999", userId: "user123" },
					status: "EXPORTED",
				},
				select: {
					title: true,
					ISBN: true,
					googleImgSrc: true,
					markdown: true,
					googleTitle: true,
					googleHref: true,
					googleAuthors: true,
					googleDescription: true,
					googleSubTitle: true,
				},
			});
			expect(result).toBeNull();
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.books.findUnique).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(
				booksQueryRepository.findByISBN(
					"978-0123456789",
					"user123",
					"EXPORTED",
				),
			).rejects.toThrow("Database error");

			expect(prisma.books.findUnique).toHaveBeenCalledWith({
				where: {
					ISBN_userId: { ISBN: "978-0123456789", userId: "user123" },
					status: "EXPORTED",
				},
				select: {
					title: true,
					ISBN: true,
					googleImgSrc: true,
					markdown: true,
					googleTitle: true,
					googleHref: true,
					googleAuthors: true,
					googleDescription: true,
					googleSubTitle: true,
				},
			});
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

			vi.mocked(prisma.books.findMany).mockResolvedValue(mockBooks);

			const params = {
				orderBy: { createdAt: "desc" as const },
				take: 10,
				skip: 0,
			};

			const result = await booksQueryRepository.findMany(
				"user123",
				"EXPORTED",
				params,
			);

			expect(prisma.books.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { ISBN: true, title: true, googleImgSrc: true },
				...params,
			});
			expect(result).toEqual(mockBooks);
		});

		test("should handle empty results", async () => {
			vi.mocked(prisma.books.findMany).mockResolvedValue([]);

			const result = await booksQueryRepository.findMany("user123", "EXPORTED");

			expect(prisma.books.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { ISBN: true, title: true, googleImgSrc: true },
			});
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

			vi.mocked(prisma.books.findMany).mockResolvedValue(mockBooks);

			const params = {
				cacheStrategy: { ttl: 400, swr: 40, tags: ["books"] },
			};

			const result = await booksQueryRepository.findMany(
				"user123",
				"EXPORTED",
				params,
			);

			expect(prisma.books.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { ISBN: true, title: true, googleImgSrc: true },
				cacheStrategy: { ttl: 400, swr: 40, tags: ["books"] },
			});
			expect(result).toEqual(mockBooks);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.books.findMany).mockRejectedValue(
				new Error("Database connection error"),
			);

			await expect(
				booksQueryRepository.findMany("user123", "EXPORTED"),
			).rejects.toThrow("Database connection error");

			expect(prisma.books.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { ISBN: true, title: true, googleImgSrc: true },
			});
		});
	});

	describe("count", () => {
		test("should return count of books", async () => {
			vi.mocked(prisma.books.count).mockResolvedValue(25);

			const result = await booksQueryRepository.count("user123", "EXPORTED");

			expect(prisma.books.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
			});
			expect(result).toBe(25);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(prisma.books.count).mockResolvedValue(0);

			const result = await booksQueryRepository.count("user123", "UNEXPORTED");

			expect(prisma.books.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "UNEXPORTED" },
			});
			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.books.count).mockRejectedValue(
				new Error("Database count error"),
			);

			await expect(
				booksQueryRepository.count("user123", "EXPORTED"),
			).rejects.toThrow("Database count error");

			expect(prisma.books.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
			});
		});
	});
});

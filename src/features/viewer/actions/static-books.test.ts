import { beforeEach, describe, expect, test, vi } from "vitest";
import prisma from "@/prisma";
import { getAllStaticBooks, getStaticBooksCount } from "./static-books";

vi.mock("@/prisma", () => ({
	default: {
		staticBooks: {
			findMany: vi.fn(),
			count: vi.fn(),
		},
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
					ISBN: "978-0123456789",
					title: "Test Book 1",
					uint8ArrayImage: new Uint8Array([1, 2, 3]),
				},
				{
					ISBN: "978-0987654321",
					title: "Test Book 2",
					uint8ArrayImage: new Uint8Array([4, 5, 6]),
				},
			];

			vi.mocked(prisma.staticBooks.findMany).mockResolvedValue(mockBooks);

			const result = await getAllStaticBooks();

			expect(prisma.staticBooks.findMany).toHaveBeenCalledWith({
				select: { ISBN: true, title: true, uint8ArrayImage: true },
				cacheStrategy: { ttl: 400, tags: ["staticBooks"] },
			});

			expect(result).toEqual([
				{
					title: "Test Book 1",
					href: "978-0123456789",
					uint8ArrayImage: new Uint8Array([1, 2, 3]),
				},
				{
					title: "Test Book 2",
					href: "978-0987654321",
					uint8ArrayImage: new Uint8Array([4, 5, 6]),
				},
			]);
		});

		test("should handle empty results", async () => {
			vi.mocked(prisma.staticBooks.findMany).mockResolvedValue([]);

			const result = await getAllStaticBooks();

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.staticBooks.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getAllStaticBooks()).rejects.toThrow("Database error");
		});

		test("should handle books with null images", async () => {
			const mockBooks = [
				{
					ISBN: "978-0123456789",
					title: "Test Book",
					uint8ArrayImage: null,
				},
			];

			vi.mocked(prisma.staticBooks.findMany).mockResolvedValue(mockBooks);

			const result = await getAllStaticBooks();

			expect(result).toEqual([
				{
					title: "Test Book",
					href: "978-0123456789",
					uint8ArrayImage: null,
				},
			]);
		});
	});

	describe("getStaticBooksCount", () => {
		test("should return count of static books", async () => {
			vi.mocked(prisma.staticBooks.count).mockResolvedValue(42);

			const result = await getStaticBooksCount();

			expect(prisma.staticBooks.count).toHaveBeenCalledWith({});
			expect(result).toBe(42);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(prisma.staticBooks.count).mockResolvedValue(0);

			const result = await getStaticBooksCount();

			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.staticBooks.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getStaticBooksCount()).rejects.toThrow("Database error");
		});
	});
});

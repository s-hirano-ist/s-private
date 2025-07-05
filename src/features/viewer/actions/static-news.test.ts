import { beforeEach, describe, expect, it, vi } from "vitest";
import { PAGE_SIZE } from "@/constants";
import prisma from "@/prisma";
import { getStaticNews, getStaticNewsCount } from "./static-news";

vi.mock("@/prisma", () => ({
	default: {
		staticNews: {
			findMany: vi.fn(),
			count: vi.fn(),
		},
	},
}));

vi.mock("@/constants", () => ({
	PAGE_SIZE: 10,
}));

describe("static-news", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getStaticNews", () => {
		it("should fetch static news with correct pagination for first page", async () => {
			const mockNews = [
				{
					id: 1,
					title: "Test News 1",
					url: "https://example.com/news1",
					quote: "This is a test quote 1",
				},
				{
					id: 2,
					title: "Test News 2",
					url: "https://example.com/news2",
					quote: "This is a test quote 2",
				},
			];

			vi.mocked(prisma.staticNews.findMany).mockResolvedValue(mockNews);

			const result = await getStaticNews(1);

			expect(prisma.staticNews.findMany).toHaveBeenCalledWith({
				select: { id: true, title: true, url: true, quote: true },
				skip: 0,
				take: PAGE_SIZE,
				cacheStrategy: { ttl: 400, swr: 40, tags: ["staticNews"] },
			});

			expect(result).toEqual(mockNews);
		});

		it("should fetch static news with correct pagination for second page", async () => {
			const mockNews = [
				{
					id: 11,
					title: "Test News 11",
					url: "https://example.com/news11",
					quote: "This is a test quote 11",
				},
			];

			vi.mocked(prisma.staticNews.findMany).mockResolvedValue(mockNews);

			const result = await getStaticNews(2);

			expect(prisma.staticNews.findMany).toHaveBeenCalledWith({
				select: { id: true, title: true, url: true, quote: true },
				skip: 10,
				take: PAGE_SIZE,
				cacheStrategy: { ttl: 400, swr: 40, tags: ["staticNews"] },
			});

			expect(result).toEqual(mockNews);
		});

		it("should fetch static news with correct pagination for third page", async () => {
			const mockNews: any[] = [];

			vi.mocked(prisma.staticNews.findMany).mockResolvedValue(mockNews);

			const result = await getStaticNews(3);

			expect(prisma.staticNews.findMany).toHaveBeenCalledWith({
				select: { id: true, title: true, url: true, quote: true },
				skip: 20,
				take: PAGE_SIZE,
				cacheStrategy: { ttl: 400, swr: 40, tags: ["staticNews"] },
			});

			expect(result).toEqual([]);
		});

		it("should handle empty results", async () => {
			vi.mocked(prisma.staticNews.findMany).mockResolvedValue([]);

			const result = await getStaticNews(1);

			expect(result).toEqual([]);
		});

		it("should handle database errors", async () => {
			vi.mocked(prisma.staticNews.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getStaticNews(1)).rejects.toThrow("Database error");
		});

		it("should handle page 0 correctly", async () => {
			const mockNews = [
				{
					id: 1,
					title: "Test News 1",
					url: "https://example.com/news1",
					quote: "This is a test quote 1",
				},
			];

			vi.mocked(prisma.staticNews.findMany).mockResolvedValue(mockNews);

			const result = await getStaticNews(0);

			expect(prisma.staticNews.findMany).toHaveBeenCalledWith({
				select: { id: true, title: true, url: true, quote: true },
				skip: -10,
				take: PAGE_SIZE,
				cacheStrategy: { ttl: 400, swr: 40, tags: ["staticNews"] },
			});

			expect(result).toEqual(mockNews);
		});

		it("should handle large page numbers", async () => {
			const mockNews: any[] = [];

			vi.mocked(prisma.staticNews.findMany).mockResolvedValue(mockNews);

			const result = await getStaticNews(100);

			expect(prisma.staticNews.findMany).toHaveBeenCalledWith({
				select: { id: true, title: true, url: true, quote: true },
				skip: 990,
				take: PAGE_SIZE,
				cacheStrategy: { ttl: 400, swr: 40, tags: ["staticNews"] },
			});

			expect(result).toEqual([]);
		});
	});

	describe("getStaticNewsCount", () => {
		it("should return count of static news", async () => {
			vi.mocked(prisma.staticNews.count).mockResolvedValue(100);

			const result = await getStaticNewsCount();

			expect(prisma.staticNews.count).toHaveBeenCalledWith({});
			expect(result).toBe(100);
		});

		it("should return 0 for empty collection", async () => {
			vi.mocked(prisma.staticNews.count).mockResolvedValue(0);

			const result = await getStaticNewsCount();

			expect(result).toBe(0);
		});

		it("should handle database errors", async () => {
			vi.mocked(prisma.staticNews.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getStaticNewsCount()).rejects.toThrow("Database error");
		});
	});
});

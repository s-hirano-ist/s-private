import { beforeEach, describe, expect, test, vi } from "vitest";
import {
	categoryQueryRepository,
	newsQueryRepository,
} from "@/infrastructure/news/repositories/news-query-repository";
import {
	getCategories,
	getExportedNews,
	getNewsCount,
	getUnexportedNews,
} from "./get-news";

vi.mock("@/infrastructure/news/repositories/news-query-repository", () => ({
	newsQueryRepository: {
		findMany: vi.fn(),
		count: vi.fn(),
	},
	categoryQueryRepository: {
		findMany: vi.fn(),
	},
}));

vi.mock("@/utils/auth/session", () => ({
	getSelfId: vi.fn().mockResolvedValue("test-user-id"),
}));

describe("get-news", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getExportedNews", () => {
		test("should fetch and transform exported news correctly", async () => {
			const mockNews = [
				{
					id: "1",
					title: "Test News 1",
					quote: "Test quote 1",
					url: "https://example1.com",
					ogTitle: "OG Title 1",
					ogDescription: "OG Description 1",
					categoryName: "Tech",
					categoryId: 1,
				},
				{
					id: "2",
					title: "Test News 2",
					quote: "Test quote 2",
					url: "https://example2.com",
					ogTitle: "OG Title 2",
					ogDescription: "OG Description 2",
					categoryName: "Science",
					categoryId: 2,
				},
			];

			vi.mocked(newsQueryRepository.findMany).mockResolvedValue(mockNews);

			const result = await getExportedNews(1);

			expect(newsQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
				{
					skip: 0,
					take: 24,
					orderBy: { createdAt: "desc" },
					cacheStrategy: { ttl: 400, swr: 40, tags: ["news"] },
				},
			);

			expect(result).toEqual([
				{
					id: "Tech",
					key: "1",
					title: "Test News 1",
					description: "Test quote 1 \n OG Title 1 \n OG Description 1",
					href: "https://example1.com",
					badgeText: "example1.com",
				},
				{
					id: "Science",
					key: "2",
					title: "Test News 2",
					description: "Test quote 2 \n OG Title 2 \n OG Description 2",
					href: "https://example2.com",
					badgeText: "example2.com",
				},
			]);
		});

		test("should handle pagination correctly", async () => {
			vi.mocked(newsQueryRepository.findMany).mockResolvedValue([]);

			await getExportedNews(3);

			expect(newsQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
				{
					skip: 48,
					take: 24,
					orderBy: { createdAt: "desc" },
					cacheStrategy: { ttl: 400, swr: 40, tags: ["news"] },
				},
			);
		});

		test("should handle empty results", async () => {
			vi.mocked(newsQueryRepository.findMany).mockResolvedValue([]);

			const result = await getExportedNews(1);

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(newsQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getExportedNews(1)).rejects.toThrow("Database error");
		});
	});

	describe("getUnexportedNews", () => {
		test("should fetch and transform unexported news correctly", async () => {
			const mockNews = [
				{
					id: "1",
					title: "Unexported News 1",
					quote: "Test quote 1",
					url: "https://example1.com",
					categoryName: "Tech",
					categoryId: 1,
					ogTitle: "OG Title 1",
					ogDescription: "OG Description 1",
				},
				{
					id: "2",
					title: "Unexported News 2",
					quote: null,
					url: "https://example2.com",
					categoryName: "Science",
					categoryId: 2,
					ogTitle: "OG Title 2",
					ogDescription: "OG Description 2",
				},
			];

			vi.mocked(newsQueryRepository.findMany).mockResolvedValue(mockNews);

			const result = await getUnexportedNews(1);

			expect(newsQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"UNEXPORTED",
				{
					skip: 0,
					take: 24,
					orderBy: { createdAt: "desc" },
				},
			);

			expect(result).toEqual([
				{
					id: "Tech",
					key: "1",
					title: "Unexported News 1",
					description: "Test quote 1",
					href: "https://example1.com",
					badgeText: "example1.com",
				},
				{
					id: "Science",
					key: "2",
					title: "Unexported News 2",
					description: undefined,
					href: "https://example2.com",
					badgeText: "example2.com",
				},
			]);
		});

		test("should handle empty results", async () => {
			vi.mocked(newsQueryRepository.findMany).mockResolvedValue([]);

			const result = await getUnexportedNews(1);

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(newsQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getUnexportedNews(1)).rejects.toThrow("Database error");
		});
	});

	describe("getNewsCount", () => {
		test("should return count of news by status", async () => {
			vi.mocked(newsQueryRepository.count).mockResolvedValue(15);

			const result = await getNewsCount("EXPORTED");

			expect(newsQueryRepository.count).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
			);
			expect(result).toBe(15);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(newsQueryRepository.count).mockResolvedValue(0);

			const result = await getNewsCount("UNEXPORTED");

			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(newsQueryRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getNewsCount("EXPORTED")).rejects.toThrow("Database error");
		});
	});

	describe("getCategories", () => {
		test("should fetch categories correctly", async () => {
			const mockCategories = [
				{ categoryId: 1, categoryName: "Science" },
				{ categoryId: 2, categoryName: "Tech" },
			];

			vi.mocked(categoryQueryRepository.findMany).mockResolvedValue(
				mockCategories,
			);

			const result = await getCategories();

			expect(categoryQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				{
					orderBy: { name: "asc" },
				},
			);

			expect(result).toEqual([
				{ id: 1, name: "Science" },
				{ id: 2, name: "Tech" },
			]);
		});

		test("should handle empty results", async () => {
			vi.mocked(categoryQueryRepository.findMany).mockResolvedValue([]);

			const result = await getCategories();

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(categoryQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getCategories()).rejects.toThrow("Database error");
		});
	});
});

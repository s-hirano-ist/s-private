import { beforeEach, describe, expect, test, vi } from "vitest";
import { categoryQueryRepository } from "@/features/news/repositories/category-query-repository";
import { newsQueryRepository } from "@/features/news/repositories/news-query-repository";
import {
	getCategoriesByUserId,
	getExportedNews,
	getNewsCount,
	getUnexportedNews,
} from "./get-news";

vi.mock("@/features/news/repositories/news-query-repository", () => ({
	newsQueryRepository: {
		findMany: vi.fn(),
		count: vi.fn(),
	},
}));

vi.mock("@/features/news/repositories/category-query-repository", () => ({
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
					id: 1,
					title: "Test News 1",
					quote: "Test quote 1",
					url: "https://example1.com",
					ogTitle: "OG Title 1",
					ogDescription: "OG Description 1",
					Category: { name: "Tech" },
				},
				{
					id: 2,
					title: "Test News 2",
					quote: "Test quote 2",
					url: "https://example2.com",
					ogTitle: "OG Title 2",
					ogDescription: "OG Description 2",
					Category: { name: "Science" },
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
					id: 1,
					title: "Test News 1",
					description: "Test quote 1 \n OG Title 1 \n OG Description 1",
					href: "https://example1.com",
					badgeText: "Tech",
				},
				{
					id: 2,
					title: "Test News 2",
					description: "Test quote 2 \n OG Title 2 \n OG Description 2",
					href: "https://example2.com",
					badgeText: "Science",
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
					id: 1,
					title: "Unexported News 1",
					quote: "Test quote 1",
					url: "https://example1.com",
					Category: { name: "Tech" },
				},
				{
					id: 2,
					title: "Unexported News 2",
					quote: null,
					url: "https://example2.com",
					Category: { name: "Science" },
				},
			];

			vi.mocked(newsQueryRepository.findMany).mockResolvedValue(mockNews);

			const result = await getUnexportedNews();

			expect(newsQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"UNEXPORTED",
				{
					orderBy: { createdAt: "desc" },
				},
			);

			expect(result).toEqual([
				{
					id: 1,
					title: "Unexported News 1",
					description: "Test quote 1",
					href: "https://example1.com",
					badgeText: "Tech",
				},
				{
					id: 2,
					title: "Unexported News 2",
					description: undefined,
					href: "https://example2.com",
					badgeText: "Science",
				},
			]);
		});

		test("should handle empty results", async () => {
			vi.mocked(newsQueryRepository.findMany).mockResolvedValue([]);

			const result = await getUnexportedNews();

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(newsQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getUnexportedNews()).rejects.toThrow("Database error");
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

	describe("getCategoriesByUserId", () => {
		test("should fetch categories correctly", async () => {
			const mockCategories = [
				{ id: 1, name: "Science", userId: "test-user-id" },
				{ id: 2, name: "Tech", userId: "test-user-id" },
			];

			vi.mocked(categoryQueryRepository.findMany).mockResolvedValue(
				mockCategories,
			);

			const result = await getCategoriesByUserId();

			expect(categoryQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				{
					orderBy: { name: "asc" },
				},
			);

			expect(result).toEqual(mockCategories);
		});

		test("should handle empty results", async () => {
			vi.mocked(categoryQueryRepository.findMany).mockResolvedValue([]);

			const result = await getCategoriesByUserId();

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(categoryQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getCategoriesByUserId()).rejects.toThrow("Database error");
		});
	});
});

import { beforeEach, describe, expect, test, vi } from "vitest";
import {
	categoryQueryRepository,
	newsQueryRepository,
} from "@/infrastructures/news/repositories/news-query-repository";
import {
	getCategories,
	getExportedNews,
	getExportedNewsCount,
	getUnexportedNews,
	getUnexportedNewsCount,
} from "./get-news";

vi.mock("@/infrastructures/news/repositories/news-query-repository", () => ({
	newsQueryRepository: {
		findMany: vi.fn(),
		count: vi.fn(),
	},
	categoryQueryRepository: {
		findMany: vi.fn(),
	},
}));

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn().mockResolvedValue("test-user-id"),
}));

describe("get-news", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getExportedNews", () => {
		test("should fetch and transform exported news correctly", async () => {
			vi.mocked(newsQueryRepository.findMany).mockResolvedValue([
				{
					id: "1",
					title: "Test News 1",
					quote: "Test quote 1",
					url: "https://example1.com",
					ogTitle: "OG Title 1",
					ogDescription: "OG Description 1",
					category: { name: "Tech", id: "1" },
				},
				{
					id: "2",
					title: "Test News 2",
					quote: "Test quote 2",
					url: "https://example2.com",
					ogTitle: "OG Title 2",
					ogDescription: "OG Description 2",
					category: { name: "Science", id: "2" },
				},
			]);
			vi.mocked(newsQueryRepository.count).mockResolvedValue(50);

			const result = await getExportedNews(0);

			expect(newsQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
				{
					skip: 0,
					take: 24,
					orderBy: { createdAt: "desc" },
					cacheStrategy: { ttl: 400, swr: 40, tags: ["testuserid_news_0"] },
				},
			);

			expect(result).toEqual({
				data: [
					{
						id: "1",
						key: "1",
						title: "Test News 1",
						description: "Test quote 1 \n OG Title 1 \n OG Description 1...",
						href: "https://example1.com",
						primaryBadgeText: "Tech",
						secondaryBadgeText: "example1.com",
					},
					{
						id: "2",
						key: "2",
						title: "Test News 2",
						description: "Test quote 2 \n OG Title 2 \n OG Description 2...",
						href: "https://example2.com",
						primaryBadgeText: "Science",
						secondaryBadgeText: "example2.com",
					},
				],
				totalCount: 50,
			});
		});

		test("should handle pagination correctly", async () => {
			vi.mocked(newsQueryRepository.findMany).mockResolvedValue([]);
			vi.mocked(newsQueryRepository.count).mockResolvedValue(0);

			await getExportedNews(48);

			expect(newsQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
				{
					skip: 48,
					take: 24,
					orderBy: { createdAt: "desc" },
					cacheStrategy: { ttl: 400, swr: 40, tags: ["testuserid_news_48"] },
				},
			);
		});

		test("should handle empty results", async () => {
			vi.mocked(newsQueryRepository.findMany).mockResolvedValue([]);
			vi.mocked(newsQueryRepository.count).mockResolvedValue(0);

			const result = await getExportedNews(0);

			expect(result).toEqual({
				data: [],
				totalCount: 0,
			});
		});

		test("should handle database errors", async () => {
			vi.mocked(newsQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getExportedNews(0)).rejects.toThrow("Database error");
		});
	});

	describe("getUnexportedNews", () => {
		test("should fetch and transform unexported news correctly", async () => {
			vi.mocked(newsQueryRepository.findMany).mockResolvedValue([
				{
					id: "1",
					title: "Unexported News 1",
					quote: "Test quote 1",
					url: "https://example1.com",
					category: { name: "Tech", id: "1" },
					ogTitle: "OG Title 1",
					ogDescription: "OG Description 1",
				},
				{
					id: "2",
					title: "Unexported News 2",
					quote: null,
					url: "https://example2.com",
					category: { name: "Science", id: "2" },
					ogTitle: "OG Title 2",
					ogDescription: "OG Description 2",
				},
			]);
			vi.mocked(newsQueryRepository.count).mockResolvedValue(25);

			const result = await getUnexportedNews(0);

			expect(newsQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"UNEXPORTED",
				{
					skip: 0,
					take: 24,
					orderBy: { createdAt: "desc" },
				},
			);

			expect(result).toEqual({
				data: [
					{
						id: "1",
						key: "1",
						title: "Unexported News 1",
						description: "Test quote 1 \n OG Title 1 \n OG Description 1...",
						href: "https://example1.com",
						primaryBadgeText: "Tech",
						secondaryBadgeText: "example1.com",
					},
					{
						id: "2",
						key: "2",
						title: "Unexported News 2",
						description: "null \n OG Title 2 \n OG Description 2...",
						href: "https://example2.com",
						primaryBadgeText: "Science",
						secondaryBadgeText: "example2.com",
					},
				],
				totalCount: 25,
			});
		});

		test("should handle empty results", async () => {
			vi.mocked(newsQueryRepository.findMany).mockResolvedValue([]);
			vi.mocked(newsQueryRepository.count).mockResolvedValue(0);

			const result = await getUnexportedNews(0);

			expect(result).toEqual({
				data: [],
				totalCount: 0,
			});
		});

		test("should handle database errors", async () => {
			vi.mocked(newsQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getUnexportedNews(0)).rejects.toThrow("Database error");
		});
	});

	describe("getExportedNewsCount", () => {
		test("should return count of exported news", async () => {
			vi.mocked(newsQueryRepository.count).mockResolvedValue(15);

			const result = await getExportedNewsCount();

			expect(newsQueryRepository.count).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
			);
			expect(result).toEqual(15);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(newsQueryRepository.count).mockResolvedValue(0);

			const result = await getExportedNewsCount();

			expect(result).toEqual(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(newsQueryRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getExportedNewsCount()).rejects.toThrow("Database error");
		});
	});

	describe("getUnexportedNewsCount", () => {
		test("should return count of unexported news", async () => {
			vi.mocked(newsQueryRepository.count).mockResolvedValue(25);

			const result = await getUnexportedNewsCount();

			expect(newsQueryRepository.count).toHaveBeenCalledWith(
				"test-user-id",
				"UNEXPORTED",
			);
			expect(result).toEqual(25);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(newsQueryRepository.count).mockResolvedValue(0);

			const result = await getUnexportedNewsCount();

			expect(result).toEqual(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(newsQueryRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getUnexportedNewsCount()).rejects.toThrow("Database error");
		});
	});

	describe("getCategories", () => {
		test("should fetch categories correctly", async () => {
			const mockCategories = [
				{
					id: "01234567-89ab-4def-9123-456789abcdef",
					name: "Science",
				},
				{
					id: "01234567-89ab-cdef-0123-456789abcde0",
					name: "Tech",
				},
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
				{
					id: "01234567-89ab-4def-9123-456789abcdef",
					name: "Science",
				},
				{
					id: "01234567-89ab-cdef-0123-456789abcde0",
					name: "Tech",
				},
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

			const result = await getCategories();
			expect(result).toEqual([]);
		});
	});
});

import { beforeEach, describe, expect, test, vi } from "vitest";
import {
	articlesQueryRepository,
	categoryQueryRepository,
} from "@/infrastructures/articles/repositories/articles-query-repository";
import {
	getCategories,
	getExportedArticles,
	getExportedArticlesCount,
	getUnexportedArticles,
} from "./get-articles";

vi.mock(
	"@/infrastructures/articles/repositories/articles-query-repository",
	() => ({
		articlesQueryRepository: {
			findMany: vi.fn(),
			count: vi.fn(),
		},
		categoryQueryRepository: {
			findMany: vi.fn(),
		},
	}),
);

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn().mockResolvedValue("test-user-id"),
}));

describe("get-articles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getExportedArticles", () => {
		test("should fetch and transform exported articles correctly", async () => {
			vi.mocked(articlesQueryRepository.findMany).mockResolvedValue([
				{
					id: "1",
					title: "Test Article 1",
					quote: "Test quote 1",
					url: "https://example1.com",
					ogTitle: "OG Title 1",
					ogDescription: "OG Description 1",
					Category: { name: "Tech", id: "1" },
				},
				{
					id: "2",
					title: "Test Article 2",
					quote: "Test quote 2",
					url: "https://example2.com",
					ogTitle: "OG Title 2",
					ogDescription: "OG Description 2",
					Category: { name: "Science", id: "2" },
				},
			]);
			vi.mocked(articlesQueryRepository.count).mockResolvedValue(50);

			const result = await getExportedArticles(0);

			expect(articlesQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
				{
					skip: 0,
					take: 24,
					orderBy: { createdAt: "desc" },
					cacheStrategy: { ttl: 400, swr: 40, tags: ["testuserid_articles_0"] },
				},
			);

			expect(result).toEqual({
				data: [
					{
						id: "1",
						key: "1",
						title: "Test Article 1",
						description: "Test quote 1\nOG Title 1\nOG Description 1",
						href: "https://example1.com",
						primaryBadgeText: "Tech",
						secondaryBadgeText: "example1.com",
					},
					{
						id: "2",
						key: "2",
						title: "Test Article 2",
						description: "Test quote 2\nOG Title 2\nOG Description 2",
						href: "https://example2.com",
						primaryBadgeText: "Science",
						secondaryBadgeText: "example2.com",
					},
				],
				totalCount: 50,
			});
		});

		test("should handle pagination correctly", async () => {
			vi.mocked(articlesQueryRepository.findMany).mockResolvedValue([]);
			vi.mocked(articlesQueryRepository.count).mockResolvedValue(0);

			await getExportedArticles(48);

			expect(articlesQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
				{
					skip: 48,
					take: 24,
					orderBy: { createdAt: "desc" },
					cacheStrategy: {
						ttl: 400,
						swr: 40,
						tags: ["testuserid_articles_48"],
					},
				},
			);
		});

		test("should handle empty results", async () => {
			vi.mocked(articlesQueryRepository.findMany).mockResolvedValue([]);
			vi.mocked(articlesQueryRepository.count).mockResolvedValue(0);

			const result = await getExportedArticles(0);

			expect(result).toEqual({
				data: [],
				totalCount: 0,
			});
		});

		test("should handle database errors", async () => {
			vi.mocked(articlesQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getExportedArticles(0)).rejects.toThrow("Database error");
		});
	});

	describe("getUnexportedArticles", () => {
		test("should fetch and transform unexported articles correctly", async () => {
			vi.mocked(articlesQueryRepository.findMany).mockResolvedValue([
				{
					id: "1",
					title: "Unexported Article 1",
					quote: "Test quote 1",
					url: "https://example1.com",
					Category: { name: "Tech", id: "1" },
					ogTitle: "OG Title 1",
					ogDescription: "OG Description 1",
				},
				{
					id: "2",
					title: "Unexported Article 2",
					quote: null,
					url: "https://example2.com",
					Category: { name: "Science", id: "2" },
					ogTitle: "OG Title 2",
					ogDescription: "OG Description 2",
				},
			]);
			vi.mocked(articlesQueryRepository.count).mockResolvedValue(25);

			const result = await getUnexportedArticles(0);

			expect(articlesQueryRepository.findMany).toHaveBeenCalledWith(
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
						title: "Unexported Article 1",
						description: "Test quote 1\nOG Title 1\nOG Description 1",
						href: "https://example1.com",
						primaryBadgeText: "Tech",
						secondaryBadgeText: "example1.com",
					},
					{
						id: "2",
						key: "2",
						title: "Unexported Article 2",
						description: "OG Title 2\nOG Description 2",
						href: "https://example2.com",
						primaryBadgeText: "Science",
						secondaryBadgeText: "example2.com",
					},
				],
				totalCount: 25,
			});
		});

		test("should handle empty results", async () => {
			vi.mocked(articlesQueryRepository.findMany).mockResolvedValue([]);
			vi.mocked(articlesQueryRepository.count).mockResolvedValue(0);

			const result = await getUnexportedArticles(0);

			expect(result).toEqual({
				data: [],
				totalCount: 0,
			});
		});

		test("should handle database errors", async () => {
			vi.mocked(articlesQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getUnexportedArticles(0)).rejects.toThrow("Database error");
		});
	});

	describe("getExportedArticlesCount", () => {
		test("should return count of exported articles", async () => {
			vi.mocked(articlesQueryRepository.count).mockResolvedValue(15);

			const result = await getExportedArticlesCount();

			expect(articlesQueryRepository.count).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
			);
			expect(result).toEqual(15);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(articlesQueryRepository.count).mockResolvedValue(0);

			const result = await getExportedArticlesCount();

			expect(result).toEqual(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(articlesQueryRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getExportedArticlesCount()).rejects.toThrow(
				"Database error",
			);
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

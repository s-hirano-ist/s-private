import {
	makeArticleTitle,
	makeCategoryName,
	makeOgDescription,
	makeOgTitle,
	makeQuote,
	makeUrl,
} from "@s-hirano-ist/s-core/articles/entities/article-entity";
import {
	makeId,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import prisma from "@/prisma";
import {
	articlesQueryRepository,
	categoryQueryRepository,
} from "./articles-query-repository";

describe("ArticlesQueryRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findMany", () => {
		test("should find multiple articles successfully", async () => {
			const mockArticles = [
				{
					id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b",
					title: "First article",
					url: "https://example.com/article/1",
					quote: "First quote",
					ogTitle: "First OG Title",
					ogDescription: "First OG Description",
					Category: { name: "Tech" },
				},
				{
					id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7c",
					title: "Second article",
					url: "https://example.com/article/2",
					quote: null,
					ogTitle: "Second OG Title",
					ogDescription: "Second OG Description",
					Category: { name: "Science" },
				},
			];

			vi.mocked(prisma.article.findMany).mockResolvedValue(mockArticles);

			const params = {
				orderBy: { createdAt: "desc" as const },
				take: 10,
				skip: 0,
			};

			const result = await articlesQueryRepository.findMany(
				makeUserId("user123"),
				"EXPORTED",
				params,
			);

			expect(prisma.article.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: {
					id: true,
					title: true,
					url: true,
					quote: true,
					ogTitle: true,
					ogDescription: true,
					Category: { select: { name: true } },
				},
				...params,
			});
			expect(result).toEqual([
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b"),
					title: makeArticleTitle("First article"),
					url: makeUrl("https://example.com/article/1"),
					quote: makeQuote("First quote"),
					ogTitle: makeOgTitle("First OG Title"),
					ogDescription: makeOgDescription("First OG Description"),
					categoryName: makeCategoryName("Tech"),
				},
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7c"),
					title: makeArticleTitle("Second article"),
					url: makeUrl("https://example.com/article/2"),
					quote: makeQuote(null),
					ogTitle: makeOgTitle("Second OG Title"),
					ogDescription: makeOgDescription("Second OG Description"),
					categoryName: makeCategoryName("Science"),
				},
			]);
		});

		test("should handle empty results", async () => {
			vi.mocked(prisma.article.findMany).mockResolvedValue([]);

			const result = await articlesQueryRepository.findMany(
				makeUserId("user123"),
				"EXPORTED",
				{},
			);

			expect(prisma.article.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: {
					id: true,
					title: true,
					url: true,
					quote: true,
					ogTitle: true,
					ogDescription: true,
					Category: { select: { name: true } },
				},
			});
			expect(result).toEqual([]);
		});

		test("should work with cache strategy", async () => {
			const mockArticles = [
				{
					id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7d",
					title: "Cached article",
					url: "https://example.com/article/1",
					quote: "Cached quote",
					ogTitle: "Cached OG Title",
					ogDescription: "Cached OG Description",
					Category: { name: "Tech" },
				},
			];

			vi.mocked(prisma.article.findMany).mockResolvedValue(mockArticles);

			const params = {
				cacheStrategy: { ttl: 300, swr: 30, tags: ["articles"] },
			};

			const result = await articlesQueryRepository.findMany(
				makeUserId("user123"),
				"EXPORTED",
				params,
			);

			expect(prisma.article.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: {
					id: true,
					title: true,
					url: true,
					quote: true,
					ogTitle: true,
					ogDescription: true,
					Category: { select: { name: true } },
				},
				cacheStrategy: { ttl: 300, swr: 30, tags: ["articles"] },
			});
			expect(result).toEqual([
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7d"),
					title: makeArticleTitle("Cached article"),
					url: makeUrl("https://example.com/article/1"),
					quote: makeQuote("Cached quote"),
					ogTitle: makeOgTitle("Cached OG Title"),
					ogDescription: makeOgDescription("Cached OG Description"),
					categoryName: makeCategoryName("Tech"),
				},
			]);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.article.findMany).mockRejectedValue(
				new Error("Database connection error"),
			);

			await expect(
				articlesQueryRepository.findMany(makeUserId("user123"), "EXPORTED", {}),
			).rejects.toThrow("Database connection error");

			expect(prisma.article.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: {
					id: true,
					title: true,
					url: true,
					quote: true,
					ogTitle: true,
					ogDescription: true,
					Category: { select: { name: true } },
				},
			});
		});
	});

	describe("count", () => {
		test("should return count of articles", async () => {
			vi.mocked(prisma.article.count).mockResolvedValue(42);

			const result = await articlesQueryRepository.count(
				makeUserId("user123"),
				"EXPORTED",
			);

			expect(prisma.article.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
			});
			expect(result).toBe(42);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(prisma.article.count).mockResolvedValue(0);

			const result = await articlesQueryRepository.count(
				makeUserId("user123"),
				"UNEXPORTED",
			);

			expect(prisma.article.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "UNEXPORTED" },
			});
			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.article.count).mockRejectedValue(
				new Error("Database count error"),
			);

			await expect(
				articlesQueryRepository.count(makeUserId("user123"), "EXPORTED"),
			).rejects.toThrow("Database count error");

			expect(prisma.article.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
			});
		});
	});
});

describe("CategoryQueryRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findMany", () => {
		test("should find multiple categories successfully", async () => {
			const mockCategories = [
				{ id: 1, name: "tech" },
				{ id: 2, name: "science" },
				{ id: 3, name: "politics" },
			];

			vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories);

			const params = {
				orderBy: { name: "asc" as const },
				take: 10,
				skip: 0,
			};

			const result = await categoryQueryRepository.findMany(
				makeUserId("user123"),
				params,
			);

			expect(prisma.category.findMany).toHaveBeenCalledWith({
				where: { userId: "user123" },
				select: { id: true, name: true },
				...params,
			});
			expect(result).toEqual([
				{ id: 1, name: "tech" },
				{ id: 2, name: "science" },
				{ id: 3, name: "politics" },
			]);
		});

		test("should handle empty results", async () => {
			vi.mocked(prisma.category.findMany).mockResolvedValue([]);

			const result = await categoryQueryRepository.findMany(
				makeUserId("user123"),
			);

			expect(prisma.category.findMany).toHaveBeenCalledWith({
				where: { userId: "user123" },
				select: { id: true, name: true },
			});
			expect(result).toEqual([]);
		});

		test("should work without parameters", async () => {
			const mockCategories = [
				{ id: 1, name: "tech" },
				{ id: 2, name: "science" },
			];

			vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories);

			const result = await categoryQueryRepository.findMany(
				makeUserId("user123"),
			);

			expect(prisma.category.findMany).toHaveBeenCalledWith({
				where: { userId: "user123" },
				select: { id: true, name: true },
			});
			expect(result).toEqual([
				{ id: 1, name: "tech" },
				{ id: 2, name: "science" },
			]);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.category.findMany).mockRejectedValue(
				new Error("Database connection error"),
			);

			await expect(
				categoryQueryRepository.findMany(makeUserId("user123")),
			).rejects.toThrow("Database connection error");

			expect(prisma.category.findMany).toHaveBeenCalledWith({
				where: { userId: "user123" },
				select: { id: true, name: true },
			});
		});
	});
});

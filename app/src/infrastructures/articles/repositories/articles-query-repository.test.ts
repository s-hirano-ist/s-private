import { makeUserId } from "@s-hirano-ist/s-core/common/entities/common-entity";
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
					id: "1",
					title: "First article",
					url: "https://example.com/article/1",
					quote: "First quote",
					ogTitle: "First OG Title",
					ogDescription: "First OG Description",
					Category: { id: 1, name: "Tech" },
				},
				{
					id: "2",
					title: "Second article",
					url: "https://example.com/article/2",
					quote: null,
					ogTitle: "Second OG Title",
					ogDescription: "Second OG Description",
					Category: { id: 2, name: "Science" },
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
					Category: { select: { id: true, name: true } },
				},
				...params,
			});
			expect(result).toEqual([
				{
					id: "1",
					title: "First article",
					url: "https://example.com/article/1",
					quote: "First quote",
					ogTitle: "First OG Title",
					ogDescription: "First OG Description",
					Category: { id: 1, name: "Tech" },
				},
				{
					id: "2",
					title: "Second article",
					url: "https://example.com/article/2",
					quote: null,
					ogTitle: "Second OG Title",
					ogDescription: "Second OG Description",
					Category: { id: 2, name: "Science" },
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
					Category: { select: { id: true, name: true } },
				},
			});
			expect(result).toEqual([]);
		});

		test("should work with cache strategy", async () => {
			const mockArticles = [
				{
					id: "1",
					title: "Cached article",
					url: "https://example.com/article/1",
					quote: "Cached quote",
					ogTitle: "Cached OG Title",
					ogDescription: "Cached OG Description",
					Category: { id: 1, name: "Tech" },
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
					Category: { select: { id: true, name: true } },
				},
				cacheStrategy: { ttl: 300, swr: 30, tags: ["articles"] },
			});
			expect(result).toEqual([
				{
					id: "1",
					title: "Cached article",
					url: "https://example.com/article/1",
					quote: "Cached quote",
					ogTitle: "Cached OG Title",
					ogDescription: "Cached OG Description",
					Category: { id: 1, name: "Tech" },
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
					Category: { select: { id: true, name: true } },
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

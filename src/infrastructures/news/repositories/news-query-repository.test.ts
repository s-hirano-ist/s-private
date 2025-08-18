import { beforeEach, describe, expect, test, vi } from "vitest";
import prisma from "@/prisma";
import {
	categoryQueryRepository,
	newsQueryRepository,
} from "./news-query-repository";

describe("NewsQueryRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findMany", () => {
		test("should find multiple news items successfully", async () => {
			const mockNews = [
				{
					id: "1",
					title: "First News",
					url: "https://example.com/news/1",
					quote: "First quote",
					ogTitle: "First OG Title",
					ogDescription: "First OG Description",
					Category: { id: 1, name: "Tech" },
				},
				{
					id: "2",
					title: "Second News",
					url: "https://example.com/news/2",
					quote: null,
					ogTitle: "Second OG Title",
					ogDescription: "Second OG Description",
					Category: { id: 2, name: "Science" },
				},
			];

			vi.mocked(prisma.news.findMany).mockResolvedValue(mockNews);

			const params = {
				orderBy: { createdAt: "desc" as const },
				take: 10,
				skip: 0,
			};

			const result = await newsQueryRepository.findMany(
				"user123",
				"EXPORTED",
				params,
			);

			expect(prisma.news.findMany).toHaveBeenCalledWith({
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
					title: "First News",
					url: "https://example.com/news/1",
					quote: "First quote",
					ogTitle: "First OG Title",
					ogDescription: "First OG Description",
					Category: { id: 1, name: "Tech" },
				},
				{
					id: "2",
					title: "Second News",
					url: "https://example.com/news/2",
					quote: null,
					ogTitle: "Second OG Title",
					ogDescription: "Second OG Description",
					Category: { id: 2, name: "Science" },
				},
			]);
		});

		test("should handle empty results", async () => {
			vi.mocked(prisma.news.findMany).mockResolvedValue([]);

			const result = await newsQueryRepository.findMany(
				"user123",
				"EXPORTED",
				{},
			);

			expect(prisma.news.findMany).toHaveBeenCalledWith({
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
			const mockNews = [
				{
					id: "1",
					title: "Cached News",
					url: "https://example.com/news/1",
					quote: "Cached quote",
					ogTitle: "Cached OG Title",
					ogDescription: "Cached OG Description",
					Category: { id: 1, name: "Tech" },
				},
			];

			vi.mocked(prisma.news.findMany).mockResolvedValue(mockNews);

			const params = {
				cacheStrategy: { ttl: 300, swr: 30, tags: ["news"] },
			};

			const result = await newsQueryRepository.findMany(
				"user123",
				"EXPORTED",
				params,
			);

			expect(prisma.news.findMany).toHaveBeenCalledWith({
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
				cacheStrategy: { ttl: 300, swr: 30, tags: ["news"] },
			});
			expect(result).toEqual([
				{
					id: "1",
					title: "Cached News",
					url: "https://example.com/news/1",
					quote: "Cached quote",
					ogTitle: "Cached OG Title",
					ogDescription: "Cached OG Description",
					Category: { id: 1, name: "Tech" },
				},
			]);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.news.findMany).mockRejectedValue(
				new Error("Database connection error"),
			);

			await expect(
				newsQueryRepository.findMany("user123", "EXPORTED", {}),
			).rejects.toThrow("Database connection error");

			expect(prisma.news.findMany).toHaveBeenCalledWith({
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
		test("should return count of news items", async () => {
			vi.mocked(prisma.news.count).mockResolvedValue(42);

			const result = await newsQueryRepository.count("user123", "EXPORTED");

			expect(prisma.news.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
			});
			expect(result).toBe(42);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(prisma.news.count).mockResolvedValue(0);

			const result = await newsQueryRepository.count("user123", "UNEXPORTED");

			expect(prisma.news.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "UNEXPORTED" },
			});
			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.news.count).mockRejectedValue(
				new Error("Database count error"),
			);

			await expect(
				newsQueryRepository.count("user123", "EXPORTED"),
			).rejects.toThrow("Database count error");

			expect(prisma.news.count).toHaveBeenCalledWith({
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

			vi.mocked(prisma.categories.findMany).mockResolvedValue(mockCategories);

			const params = {
				orderBy: { name: "asc" as const },
				take: 10,
				skip: 0,
			};

			const result = await categoryQueryRepository.findMany("user123", params);

			expect(prisma.categories.findMany).toHaveBeenCalledWith({
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
			vi.mocked(prisma.categories.findMany).mockResolvedValue([]);

			const result = await categoryQueryRepository.findMany("user123");

			expect(prisma.categories.findMany).toHaveBeenCalledWith({
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

			vi.mocked(prisma.categories.findMany).mockResolvedValue(mockCategories);

			const result = await categoryQueryRepository.findMany("user123");

			expect(prisma.categories.findMany).toHaveBeenCalledWith({
				where: { userId: "user123" },
				select: { id: true, name: true },
			});
			expect(result).toEqual([
				{ id: 1, name: "tech" },
				{ id: 2, name: "science" },
			]);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.categories.findMany).mockRejectedValue(
				new Error("Database connection error"),
			);

			await expect(categoryQueryRepository.findMany("user123")).rejects.toThrow(
				"Database connection error",
			);

			expect(prisma.categories.findMany).toHaveBeenCalledWith({
				where: { userId: "user123" },
				select: { id: true, name: true },
			});
		});
	});
});

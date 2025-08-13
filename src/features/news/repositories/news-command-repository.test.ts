import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/prisma", () => ({
	default: {
		news: {
			create: vi.fn(),
			delete: vi.fn(),
		},
		$transaction: vi.fn(),
	},
}));

import prisma from "@/prisma";
import { newsCommandRepository } from "./news-command-repository";

describe("NewsCommandRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("create", () => {
		test("should create news successfully", async () => {
			const mockNews = {
				id: 1,
				title: "Test News",
				url: "https://example.com/news/1",
				quote: "This is a test quote",
				ogTitle: "Test OG Title",
				ogDescription: "Test OG Description",
				Category: { name: "tech" },
			};

			const inputData = {
				title: "Test News",
				url: "https://example.com/news/1",
				quote: "This is a test quote",
				categoryId: 1,
				userId: "user123",
			};

			vi.mocked(prisma.news.create).mockResolvedValue(mockNews);

			const result = await newsCommandRepository.create(inputData);

			expect(prisma.news.create).toHaveBeenCalledWith({
				data: inputData,
				include: { Category: true },
			});
			expect(result).toEqual(mockNews);
		});

		test("should create news with null quote", async () => {
			const mockNews = {
				id: 2,
				title: "Another News",
				url: "https://example.com/news/2",
				quote: null,
				ogTitle: "Another OG Title",
				ogDescription: "Another OG Description",
				Category: { name: "science" },
			};

			const inputData = {
				title: "Another News",
				url: "https://example.com/news/2",
				quote: null,
				categoryId: 2,
				userId: "user123",
			};

			vi.mocked(prisma.news.create).mockResolvedValue(mockNews);

			const result = await newsCommandRepository.create(inputData);

			expect(prisma.news.create).toHaveBeenCalledWith({
				data: inputData,
				include: { Category: true },
			});
			expect(result).toEqual(mockNews);
		});

		test("should handle database errors during create", async () => {
			const inputData = {
				title: "Test News",
				url: "https://example.com/news/1",
				quote: "This is a test quote",
				categoryId: 1,
				userId: "user123",
			};

			vi.mocked(prisma.news.create).mockRejectedValue(
				new Error("Database constraint error"),
			);

			await expect(newsCommandRepository.create(inputData)).rejects.toThrow(
				"Database constraint error",
			);

			expect(prisma.news.create).toHaveBeenCalledWith({
				data: inputData,
				include: { Category: true },
			});
		});
	});

	describe("deleteById", () => {
		test("should delete news successfully", async () => {
			vi.mocked(prisma.news.delete).mockResolvedValue({
				id: 1,
				title: "Test News",
				url: "https://example.com/news/1",
				quote: "Test quote",
				categoryId: 1,
				userId: "user123",
				status: "EXPORTED",
				ogTitle: null,
				ogDescription: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			await newsCommandRepository.deleteById(1, "user123", "EXPORTED");

			expect(prisma.news.delete).toHaveBeenCalledWith({
				where: { id: 1, userId: "user123", status: "EXPORTED" },
			});
		});

		test("should handle not found errors during delete", async () => {
			vi.mocked(prisma.news.delete).mockRejectedValue(
				new Error("Record not found"),
			);

			await expect(
				newsCommandRepository.deleteById(999, "user123", "EXPORTED"),
			).rejects.toThrow("Record not found");

			expect(prisma.news.delete).toHaveBeenCalledWith({
				where: { id: 999, userId: "user123", status: "EXPORTED" },
			});
		});

		test("should delete news with different status", async () => {
			vi.mocked(prisma.news.delete).mockResolvedValue({
				id: 2,
				title: "Another News",
				url: "https://example.com/news/2",
				quote: null,
				categoryId: 2,
				userId: "user123",
				status: "UNEXPORTED",
				ogTitle: null,
				ogDescription: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			await newsCommandRepository.deleteById(2, "user123", "UNEXPORTED");

			expect(prisma.news.delete).toHaveBeenCalledWith({
				where: { id: 2, userId: "user123", status: "UNEXPORTED" },
			});
		});
	});

	describe("transaction", () => {
		test("should execute transaction successfully", async () => {
			const mockResult = { success: true, data: "test" };
			const mockFn = vi.fn().mockResolvedValue(mockResult);

			vi.mocked(prisma.$transaction).mockResolvedValue(mockResult);

			const result = await newsCommandRepository.transaction(mockFn);

			expect(prisma.$transaction).toHaveBeenCalledWith(mockFn);
			expect(result).toEqual(mockResult);
		});

		test("should handle transaction errors", async () => {
			const mockFn = vi.fn().mockRejectedValue(new Error("Transaction failed"));

			vi.mocked(prisma.$transaction).mockRejectedValue(
				new Error("Transaction failed"),
			);

			await expect(newsCommandRepository.transaction(mockFn)).rejects.toThrow(
				"Transaction failed",
			);

			expect(prisma.$transaction).toHaveBeenCalledWith(mockFn);
		});

		test("should pass through transaction function result", async () => {
			const complexResult = {
				created: [{ id: 1, title: "News 1" }],
				updated: [{ id: 2, title: "News 2" }],
				deleted: [3, 4],
			};

			const mockFn = vi.fn().mockResolvedValue(complexResult);
			vi.mocked(prisma.$transaction).mockResolvedValue(complexResult);

			const result = await newsCommandRepository.transaction(mockFn);

			expect(result).toEqual(complexResult);
			expect(prisma.$transaction).toHaveBeenCalledWith(mockFn);
		});
	});
});

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/prisma", () => ({
	default: {
		news: {
			create: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

vi.mock("@/o11y/server", () => ({
	serverLogger: {
		info: vi.fn(),
	},
}));

import type { Status } from "@/generated";
import prisma from "@/prisma";
import { newsCommandRepository } from "./news-command-repository";

describe("NewsCommandRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("create", () => {
		test("should create news successfully", async () => {
			const inputData = {
				title: "Test News",
				url: "https://example.com/news/1",
				quote: "This is a test quote",
				userId: "user123",
				id: "01234567-89ab-cdef-0123-456789abcdef",
				status: "UNEXPORTED",
				category: {
					name: "tech",
					userId: "user123",
					id: "01234567-89ab-cdef-0123-456789abcde0",
				},
			};

			vi.mocked(prisma.news.create).mockResolvedValue({
				title: "Test News",
				url: "https://example.com/news/1",
				quote: "This is a test quote",
				Category: { name: "tech" },
				userId: "user123",
				// eslint-disable-next-line
			} as any);

			await newsCommandRepository.create(inputData);

			expect(prisma.news.create).toHaveBeenCalled();
		});

		test.skip("should create news with null quote", async () => {
			const mockNews = {
				id: "2",
				title: "Another News",
				url: "https://example.com/news/2",
				quote: null,
				ogTitle: "Another OG Title",
				ogDescription: "Another OG Description",
				Category: { name: "science" },
				ogImageUrl: "https://example.com/og-image.jpg",
				exportedAt: new Date(),
				status: "EXPORTED" as Status,
				createdAt: new Date(),
				updatedAt: new Date(),
				userId: "user123",
			};

			const inputData = {
				title: "Another News",
				url: "https://example.com/news/2",
				quote: null,
				categoryName: "tech",
				userId: "user123",
			};

			vi.mocked(prisma.news.create).mockResolvedValue(mockNews);

			const result = await newsCommandRepository.create(inputData);

			expect(prisma.news.create).toHaveBeenCalledWith({
				data: {
					title: "Another News",
					url: "https://example.com/news/2",
					quote: null,
					userId: "user123",
					Category: {
						connectOrCreate: {
							where: {
								name_userId: { name: "tech", userId: "user123" },
							},
							create: { name: "tech", userId: "user123" },
						},
					},
				},
				select: {
					url: true,
					title: true,
					quote: true,
					Category: { select: { name: true } },
					userId: true,
				},
			});
			expect(result).toEqual(mockNews);
		});

		test("should handle database errors during create", async () => {
			const inputData = {
				title: "Test News",
				url: "https://example.com/news/1",
				quote: "This is a test quote",
				userId: "user123",
				id: "01234567-89ab-cdef-0123-456789abcdef",
				status: "UNEXPORTED",
				category: {
					name: "tech",
					userId: "user123",
					id: "01234567-89ab-cdef-0123-456789abcde0",
				},
			};

			vi.mocked(prisma.news.create).mockRejectedValue(
				new Error("Database constraint error"),
			);

			await expect(newsCommandRepository.create(inputData)).rejects.toThrow(
				"Database constraint error",
			);

			expect(prisma.news.create).toHaveBeenCalled();
		});
	});

	describe("deleteById", () => {
		test("should delete news successfully", async () => {
			vi.mocked(prisma.news.delete).mockResolvedValue({
				id: "1",
				title: "Test News",
				url: "https://example.com/news/1",
				quote: "Test quote",
				userId: "user123",
				status: "EXPORTED",
				ogTitle: null,
				ogDescription: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				ogImageUrl: "https://example.com/og-image.jpg",
				exportedAt: new Date(),
			});

			await newsCommandRepository.deleteById("1", "user123", "EXPORTED");

			expect(prisma.news.delete).toHaveBeenCalledWith({
				where: { id: "1", userId: "user123", status: "EXPORTED" },
				select: { title: true },
			});
		});

		test("should handle not found errors during delete", async () => {
			vi.mocked(prisma.news.delete).mockRejectedValue(
				new Error("Record not found"),
			);

			await expect(
				newsCommandRepository.deleteById("999", "user123", "EXPORTED"),
			).rejects.toThrow("Record not found");

			expect(prisma.news.delete).toHaveBeenCalledWith({
				where: { id: "999", userId: "user123", status: "EXPORTED" },
				select: { title: true },
			});
		});

		test("should delete news with different status", async () => {
			vi.mocked(prisma.news.delete).mockResolvedValue({
				id: "2",
				title: "Another News",
				url: "https://example.com/news/2",
				quote: null,
				userId: "user123",
				status: "UNEXPORTED",
				ogTitle: null,
				ogDescription: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				ogImageUrl: "https://example.com/og-image.jpg",
				exportedAt: new Date(),
			});

			await newsCommandRepository.deleteById("2", "user123", "UNEXPORTED");

			expect(prisma.news.delete).toHaveBeenCalledWith({
				where: { id: "2", userId: "user123", status: "UNEXPORTED" },
				select: { title: true },
			});
		});
	});
});

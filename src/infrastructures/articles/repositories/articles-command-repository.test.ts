import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Status } from "@/domains/common/entities/common-entity";
import prisma from "@/prisma";
import { articlesCommandRepository } from "./articles-command-repository";

describe("ArticlesCommandRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("create", () => {
		test("should create article successfully", async () => {
			vi.mocked(prisma.news.create).mockResolvedValue({
				title: "Test article",
				url: "https://example.com/article/1",
				quote: "This is a test quote",
				categoryId: "1",
				userId: "user123",
				id: "1",
				ogDescription: "1",
				ogImageUrl: "1",
				ogTitle: "1",
				status: "UNEXPORTED",
				createdAt: new Date(),
				updatedAt: new Date(),
				exportedAt: null,
				Category: { name: "1" },
				// eslint-disable-next-line
			} as any);

			await articlesCommandRepository.create({
				title: "Test article",
				url: "https://example.com/article/1",
				quote: "This is a test quote",
				userId: "user123",
				id: "01234567-89ab-4def-9123-456789abcdef",
				status: "UNEXPORTED",
				categoryName: "tech",
				categoryId: "01234567-89ab-cdef-0123-456789abcde0",
			});

			expect(prisma.news.create).toHaveBeenCalled();
		});

		test("should create article with null quote", async () => {
			vi.mocked(prisma.news.create).mockResolvedValue({
				id: "2",
				title: "Another article",
				url: "https://example.com/article/2",
				quote: null,
				ogTitle: "Another OG Title",
				ogDescription: "Another OG Description",
				categoryId: "1",
				ogImageUrl: "https://example.com/og-image.jpg",
				exportedAt: new Date(),
				status: "EXPORTED" as Status,
				createdAt: new Date(),
				updatedAt: new Date(),
				userId: "user123",
				Category: { name: "tech" },
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any);

			const result = await articlesCommandRepository.create({
				title: "Another article",
				url: "https://example.com/article/2",
				quote: null,
				categoryName: "tech",
				categoryId: "1",
				userId: "user123",
				id: "1",
				status: "UNEXPORTED",
			});

			expect(prisma.news.create).toHaveBeenCalledWith({
				data: {
					id: "1",
					title: "Another article",
					url: "https://example.com/article/2",
					quote: null,
					status: "UNEXPORTED",
					userId: "user123",
					Category: {
						connectOrCreate: {
							where: {
								name_userId: { name: "tech", userId: "user123" },
							},
							create: { id: "1", name: "tech", userId: "user123" },
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
			expect(result).toBeUndefined();
		});

		test("should handle database errors during create", async () => {
			vi.mocked(prisma.news.create).mockRejectedValue(
				new Error("Database constraint error"),
			);

			await expect(
				articlesCommandRepository.create({
					title: "Test article",
					url: "https://example.com/article/1",
					quote: "This is a test quote",
					userId: "user123",
					id: "01234567-89ab-4def-9123-456789abcdef",
					status: "UNEXPORTED",
					category: {
						name: "tech",
						userId: "user123",
						id: "01234567-89ab-cdef-0123-456789abcde0",
					},
				}),
			).rejects.toThrow("Database constraint error");

			expect(prisma.news.create).toHaveBeenCalled();
		});
	});

	describe("deleteById", () => {
		test("should delete article successfully", async () => {
			vi.mocked(prisma.news.delete).mockResolvedValue({
				id: "1",
				title: "Test article",
				url: "https://example.com/article/1",
				quote: "Test quote",
				userId: "user123",
				status: "EXPORTED",
				ogTitle: null,
				ogDescription: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				ogImageUrl: "https://example.com/og-image.jpg",
				exportedAt: new Date(),
				categoryId: "1",
			});

			await articlesCommandRepository.deleteById("1", "user123", "EXPORTED");

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
				articlesCommandRepository.deleteById("999", "user123", "EXPORTED"),
			).rejects.toThrow("Record not found");

			expect(prisma.news.delete).toHaveBeenCalledWith({
				where: { id: "999", userId: "user123", status: "EXPORTED" },
				select: { title: true },
			});
		});

		test("should delete article with different status", async () => {
			vi.mocked(prisma.news.delete).mockResolvedValue({
				id: "2",
				title: "Another article",
				url: "https://example.com/article/2",
				quote: null,
				userId: "user123",
				status: "UNEXPORTED",
				ogTitle: null,
				ogDescription: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				ogImageUrl: "https://example.com/og-image.jpg",
				exportedAt: new Date(),
				categoryId: "1",
			});

			await articlesCommandRepository.deleteById("2", "user123", "UNEXPORTED");

			expect(prisma.news.delete).toHaveBeenCalledWith({
				where: { id: "2", userId: "user123", status: "UNEXPORTED" },
				select: { title: true },
			});
		});
	});
});

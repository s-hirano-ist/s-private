import {
	makeArticleTitle,
	makeCategoryName,
	makeQuote,
	makeUrl,
} from "@s-hirano-ist/s-core/articles/entities/article-entity";
import type { Status } from "@s-hirano-ist/s-core/common/entities/common-entity";
import {
	makeCreatedAt,
	makeId,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/common/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import prisma from "@/prisma";
import { articlesCommandRepository } from "./articles-command-repository";

describe("ArticlesCommandRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("create", () => {
		test("should create article successfully", async () => {
			vi.mocked(prisma.article.create).mockResolvedValue({
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
			} as any);

			await articlesCommandRepository.create({
				title: makeArticleTitle("Test article"),
				url: makeUrl("https://example.com/article/1"),
				quote: makeQuote("This is a test quote"),
				userId: makeUserId("user123"),
				id: makeId("01234567-89ab-7def-9123-456789abcdef"),
				status: makeUnexportedStatus(),
				categoryName: makeCategoryName("tech"),
				createdAt: makeCreatedAt(),
			});

			expect(prisma.article.create).toHaveBeenCalled();
		});

		test("should create article with null quote", async () => {
			vi.mocked(prisma.article.create).mockResolvedValue({
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
			} as any);

			const result = await articlesCommandRepository.create({
				title: makeArticleTitle("Another article"),
				url: makeUrl("https://example.com/article/2"),
				quote: makeQuote(null),
				categoryName: makeCategoryName("tech"),
				userId: makeUserId("user123"),
				id: makeId("0198bfc4-444f-71eb-8e78-4005df127ffd"),
				status: makeUnexportedStatus(),
				createdAt: makeCreatedAt(),
			});

			expect(prisma.article.create).toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		test("should handle database errors during create", async () => {
			vi.mocked(prisma.article.create).mockRejectedValue(
				new Error("Database constraint error"),
			);

			await expect(
				articlesCommandRepository.create({
					title: makeArticleTitle("Test article"),
					url: makeUrl("https://example.com/article/1"),
					quote: makeQuote("This is a test quote"),
					userId: makeUserId("user123"),
					id: makeId("01234567-89ab-7def-9123-456789abcdef"),
					status: makeUnexportedStatus(),
					categoryName: makeCategoryName("tech"),
					createdAt: makeCreatedAt(),
				}),
			).rejects.toThrow("Database constraint error");

			expect(prisma.article.create).toHaveBeenCalled();
		});
	});

	describe("deleteById", () => {
		test("should delete article successfully", async () => {
			vi.mocked(prisma.article.delete).mockResolvedValue({
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

			await articlesCommandRepository.deleteById(
				makeId("0198bfc4-444e-73e8-9ef6-eb9b250ed1ae"),
				makeUserId("user123"),
				"EXPORTED",
			);

			expect(prisma.article.delete).toHaveBeenCalledWith({
				where: {
					id: "0198bfc4-444e-73e8-9ef6-eb9b250ed1ae",
					userId: "user123",
					status: "EXPORTED",
				},
				select: { title: true },
			});
		});

		test("should handle not found errors during delete", async () => {
			vi.mocked(prisma.article.delete).mockRejectedValue(
				new Error("Record not found"),
			);

			await expect(
				articlesCommandRepository.deleteById(
					makeId("0198bfc4-444f-71eb-8e78-46840c337877"),
					makeUserId("user123"),
					"EXPORTED",
				),
			).rejects.toThrow("Record not found");

			expect(prisma.article.delete).toHaveBeenCalledWith({
				where: {
					id: "0198bfc4-444f-71eb-8e78-46840c337877",
					userId: "user123",
					status: "EXPORTED",
				},
				select: { title: true },
			});
		});

		test("should delete article with different status", async () => {
			vi.mocked(prisma.article.delete).mockResolvedValue({
				id: "0198bfc4-444f-71eb-8e78-4eaeec50cd3e",
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

			await articlesCommandRepository.deleteById(
				makeId("0198bfc4-444f-71eb-8e78-4eaeec50cd3e"),
				makeUserId("user123"),
				makeUnexportedStatus(),
			);

			expect(prisma.article.delete).toHaveBeenCalledWith({
				where: {
					id: "0198bfc4-444f-71eb-8e78-4eaeec50cd3e",
					userId: "user123",
					status: "UNEXPORTED",
				},
				select: { title: true },
			});
		});
	});
});

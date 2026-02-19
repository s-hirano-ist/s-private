import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeUserId } from "../../shared-kernel/entities/common-entity.ts";
import { DuplicateError } from "../../shared-kernel/errors/error-classes.ts";
import { makeUrl } from "../entities/article-entity.ts";
import type { IArticlesQueryRepository } from "../repositories/articles-query-repository.interface.ts";
import { ArticlesDomainService } from "../services/articles-domain-service.ts";

describe("ArticlesDomainService", () => {
	let articlesQueryRepository: IArticlesQueryRepository;
	let articlesDomainService: ArticlesDomainService;

	beforeEach(() => {
		articlesQueryRepository = {
			findByUrl: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
			search: vi.fn(),
		} as IArticlesQueryRepository;

		articlesDomainService = new ArticlesDomainService(articlesQueryRepository);
	});

	describe("ensureNoDuplicate", () => {
		test("should not throw error when no duplicate exists", async () => {
			const url = makeUrl("https://example.com/articles");
			const userId = makeUserId("test-user-id");

			vi.mocked(articlesQueryRepository.findByUrl).mockResolvedValue(null);

			await expect(
				articlesDomainService.ensureNoDuplicate(url, userId),
			).resolves.not.toThrow();

			expect(articlesQueryRepository.findByUrl).toHaveBeenCalledWith(
				url,
				userId,
			);
		});

		test("should throw DuplicateError when duplicate exists", async () => {
			const url = makeUrl("https://example.com/articles");
			const userId = makeUserId("test-user-id");

			const mockArticle = {
				id: "existing-article-id",
				url,
				userId,
				title: "Existing Article",
				status: "UNEXPORTED" as const,
				quote: "Sample quote",
				ogTitle: "OG Title",
				ogDescription: "OG Description",
				ogImageUrl: "https://example.com/og-image.jpg",
				Category: { id: "category-id", name: "Tech" },
			};

			vi.mocked(articlesQueryRepository.findByUrl).mockResolvedValue(
				mockArticle,
			);

			await expect(
				articlesDomainService.ensureNoDuplicate(url, userId),
			).rejects.toThrow(DuplicateError);

			expect(articlesQueryRepository.findByUrl).toHaveBeenCalledWith(
				url,
				userId,
			);
		});
	});
});

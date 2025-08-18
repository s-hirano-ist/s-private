import { beforeEach, describe, expect, test, vi } from "vitest";
import { DuplicateError } from "@/common/error/error-classes";
import { makeUrl } from "@/domains/articles/entities/article-entity";
import type { IArticlesQueryRepository } from "@/domains/articles/repositories/articles-query-repository.interface";
import { ArticlesDomainService } from "@/domains/articles/services/articles-domain-service";
import { makeUserId } from "@/domains/common/entities/common-entity";

describe("ArticlesDomainService", () => {
	let articlesQueryRepository: IArticlesQueryRepository;
	let articlesDomainService: ArticlesDomainService;

	beforeEach(() => {
		articlesQueryRepository = {
			findByUrl: vi.fn(),
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

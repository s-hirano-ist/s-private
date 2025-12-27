import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeUserId } from "../../common/entities/common-entity";
import type { IArticlesCommandRepository } from "../repositories/articles-command-repository.interface";
import { ArticlesBatchDomainService } from "./articles-batch-domain-service";

describe("ArticlesBatchDomainService", () => {
	let articlesCommandRepository: IArticlesCommandRepository;
	let batchService: ArticlesBatchDomainService;

	beforeEach(() => {
		articlesCommandRepository = {
			create: vi.fn(),
			deleteById: vi.fn(),
			bulkUpdateStatus: vi.fn(),
		} as IArticlesCommandRepository;

		batchService = new ArticlesBatchDomainService(articlesCommandRepository);
	});

	describe("resetArticles", () => {
		test("should finalize LAST_UPDATED articles and mark UNEXPORTED articles", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(articlesCommandRepository.bulkUpdateStatus)
				.mockResolvedValueOnce({ count: 5 }) // finalize
				.mockResolvedValueOnce({ count: 10 }); // mark

			const result = await batchService.resetArticles(userId);

			expect(result.finalized.count).toBe(5);
			expect(result.marked.count).toBe(10);

			// Verify finalize call (LAST_UPDATED -> EXPORTED)
			expect(
				articlesCommandRepository.bulkUpdateStatus,
			).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					userId,
					fromStatus: "LAST_UPDATED",
					toStatus: "EXPORTED",
					exportedAt: expect.any(Date),
				}),
			);

			// Verify mark call (UNEXPORTED -> LAST_UPDATED)
			expect(
				articlesCommandRepository.bulkUpdateStatus,
			).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					userId,
					fromStatus: "UNEXPORTED",
					toStatus: "LAST_UPDATED",
				}),
			);
		});

		test("should handle zero articles case", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(articlesCommandRepository.bulkUpdateStatus)
				.mockResolvedValueOnce({ count: 0 })
				.mockResolvedValueOnce({ count: 0 });

			const result = await batchService.resetArticles(userId);

			expect(result.finalized.count).toBe(0);
			expect(result.marked.count).toBe(0);
		});
	});

	describe("revertArticles", () => {
		test("should revert LAST_UPDATED articles to UNEXPORTED", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(articlesCommandRepository.bulkUpdateStatus).mockResolvedValue({
				count: 7,
			});

			const result = await batchService.revertArticles(userId);

			expect(result.count).toBe(7);
			expect(articlesCommandRepository.bulkUpdateStatus).toHaveBeenCalledWith({
				userId,
				fromStatus: "LAST_UPDATED",
				toStatus: "UNEXPORTED",
			});
		});

		test("should handle zero articles case", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(articlesCommandRepository.bulkUpdateStatus).mockResolvedValue({
				count: 0,
			});

			const result = await batchService.revertArticles(userId);

			expect(result.count).toBe(0);
		});
	});
});

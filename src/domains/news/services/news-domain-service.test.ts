import { beforeEach, describe, expect, test, vi } from "vitest";
import { DuplicateError } from "@/common/error/error-classes";
import { makeUserId } from "@/domains/common/entities/common-entity";
import { makeUrl } from "@/domains/news/entities/news-entity";
import type { INewsQueryRepository } from "@/domains/news/repositories/news-query-repository.interface";
import { NewsDomainService } from "@/domains/news/services/news-domain-service";

describe("NewsDomainService", () => {
	let newsQueryRepository: INewsQueryRepository;
	let newsDomainService: NewsDomainService;

	beforeEach(() => {
		newsQueryRepository = {
			findByUrl: vi.fn(),
		} as INewsQueryRepository;

		newsDomainService = new NewsDomainService(newsQueryRepository);
	});

	describe("ensureNoDuplicate", () => {
		test("should not throw error when no duplicate exists", async () => {
			const url = makeUrl("https://example.com/news");
			const userId = makeUserId("test-user-id");

			vi.mocked(newsQueryRepository.findByUrl).mockResolvedValue(null);

			await expect(
				newsDomainService.ensureNoDuplicate(url, userId),
			).resolves.not.toThrow();

			expect(newsQueryRepository.findByUrl).toHaveBeenCalledWith(url, userId);
		});

		test("should throw DuplicateError when duplicate exists", async () => {
			const url = makeUrl("https://example.com/news");
			const userId = makeUserId("test-user-id");

			const mockNews = {
				id: "existing-news-id",
				url,
				userId,
				title: "Existing News",
				status: "UNEXPORTED" as const,
			};

			vi.mocked(newsQueryRepository.findByUrl).mockResolvedValue(mockNews);

			await expect(
				newsDomainService.ensureNoDuplicate(url, userId),
			).rejects.toThrow(DuplicateError);

			expect(newsQueryRepository.findByUrl).toHaveBeenCalledWith(url, userId);
		});
	});
});

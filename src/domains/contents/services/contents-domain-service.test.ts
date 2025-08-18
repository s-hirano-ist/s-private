import { beforeEach, describe, expect, test, vi } from "vitest";
import { DuplicateError } from "@/common/error/error-classes";
import { makeUserId } from "@/domains/common/entities/common-entity";
import { makeContentTitle } from "@/domains/contents/entities/contents-entity";
import { ContentsDomainService } from "@/domains/contents/services/contents-domain-service";
import type { IContentsQueryRepository } from "@/domains/contents/types";

describe("ContentsDomainService", () => {
	let contentsQueryRepository: IContentsQueryRepository;
	let contentsDomainService: ContentsDomainService;

	beforeEach(() => {
		contentsQueryRepository = {
			findByTitle: vi.fn(),
		} as IContentsQueryRepository;

		contentsDomainService = new ContentsDomainService(contentsQueryRepository);
	});

	describe("ensureNoDuplicate", () => {
		test("should not throw error when no duplicate exists", async () => {
			const title = makeContentTitle("My Unique Article");
			const userId = makeUserId("test-user-id");

			vi.mocked(contentsQueryRepository.findByTitle).mockResolvedValue(null);

			await expect(
				contentsDomainService.ensureNoDuplicate(title, userId),
			).resolves.not.toThrow();

			expect(contentsQueryRepository.findByTitle).toHaveBeenCalledWith(
				title,
				userId,
			);
		});

		test("should throw DuplicateError when duplicate exists", async () => {
			const title = makeContentTitle("Existing Article");
			const userId = makeUserId("test-user-id");

			const mockContent = {
				id: "existing-content-id",
				title,
				userId,
				markdown: "# Existing Content",
				status: "UNEXPORTED" as const,
			};

			vi.mocked(contentsQueryRepository.findByTitle).mockResolvedValue(
				mockContent,
			);

			await expect(
				contentsDomainService.ensureNoDuplicate(title, userId),
			).rejects.toThrow(DuplicateError);

			expect(contentsQueryRepository.findByTitle).toHaveBeenCalledWith(
				title,
				userId,
			);
		});
	});
});

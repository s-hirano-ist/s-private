import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeUserId } from "../../shared-kernel/entities/common-entity.ts";
import { DuplicateError } from "../../shared-kernel/errors/error-classes.ts";
import { makePath } from "../entities/image-entity.ts";
import type { IImagesQueryRepository } from "../repositories/images-query-repository.interface.ts";
import { ImagesDomainService } from "./images-domain-service.ts";

describe("ImagesDomainService", () => {
	let imagesQueryRepository: IImagesQueryRepository;
	let imagesDomainService: ImagesDomainService;

	beforeEach(() => {
		imagesQueryRepository = {
			findByPath: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
		} as IImagesQueryRepository;

		imagesDomainService = new ImagesDomainService(imagesQueryRepository);
	});

	describe("ensureNoDuplicate", () => {
		test("should not throw error when no duplicate exists", async () => {
			const path = makePath("unique-image.jpg", false);
			const userId = makeUserId("test-user-id");

			vi.mocked(imagesQueryRepository.findByPath).mockResolvedValue(null);

			await expect(
				imagesDomainService.ensureNoDuplicate(path, userId),
			).resolves.not.toThrow();

			expect(imagesQueryRepository.findByPath).toHaveBeenCalledWith(
				path,
				userId,
			);
		});

		test("should throw DuplicateError when duplicate exists", async () => {
			const path = makePath("existing-image.jpg", false);
			const userId = makeUserId("test-user-id");

			const mockImage = {
				id: "existing-image-id",
				path,
				userId,
				contentType: "image/jpeg",
				fileSize: 1024,
				status: "UNEXPORTED" as const,
			};

			vi.mocked(imagesQueryRepository.findByPath).mockResolvedValue(mockImage);

			await expect(
				imagesDomainService.ensureNoDuplicate(path, userId),
			).rejects.toThrow(DuplicateError);

			expect(imagesQueryRepository.findByPath).toHaveBeenCalledWith(
				path,
				userId,
			);
		});
	});
});

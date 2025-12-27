import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeUserId } from "../../common/entities/common-entity";
import type { IImagesCommandRepository } from "../repositories/images-command-repository.interface";
import { ImagesBatchDomainService } from "./images-batch-domain-service";

describe("ImagesBatchDomainService", () => {
	let imagesCommandRepository: IImagesCommandRepository;
	let batchService: ImagesBatchDomainService;

	beforeEach(() => {
		imagesCommandRepository = {
			create: vi.fn(),
			deleteById: vi.fn(),
			uploadToStorage: vi.fn(),
			bulkUpdateStatus: vi.fn(),
		} as IImagesCommandRepository;

		batchService = new ImagesBatchDomainService(imagesCommandRepository);
	});

	describe("resetImages", () => {
		test("should finalize LAST_UPDATED images and mark UNEXPORTED images", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(imagesCommandRepository.bulkUpdateStatus)
				.mockResolvedValueOnce({ count: 5 })
				.mockResolvedValueOnce({ count: 10 });

			const result = await batchService.resetImages(userId);

			expect(result.finalized.count).toBe(5);
			expect(result.marked.count).toBe(10);

			expect(imagesCommandRepository.bulkUpdateStatus).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					userId,
					fromStatus: "LAST_UPDATED",
					toStatus: "EXPORTED",
					exportedAt: expect.any(Date),
				}),
			);

			expect(imagesCommandRepository.bulkUpdateStatus).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					userId,
					fromStatus: "UNEXPORTED",
					toStatus: "LAST_UPDATED",
				}),
			);
		});

		test("should handle zero images case", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(imagesCommandRepository.bulkUpdateStatus)
				.mockResolvedValueOnce({ count: 0 })
				.mockResolvedValueOnce({ count: 0 });

			const result = await batchService.resetImages(userId);

			expect(result.finalized.count).toBe(0);
			expect(result.marked.count).toBe(0);
		});
	});

	describe("revertImages", () => {
		test("should revert LAST_UPDATED images to UNEXPORTED", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(imagesCommandRepository.bulkUpdateStatus).mockResolvedValue({
				count: 7,
			});

			const result = await batchService.revertImages(userId);

			expect(result.count).toBe(7);
			expect(imagesCommandRepository.bulkUpdateStatus).toHaveBeenCalledWith({
				userId,
				fromStatus: "LAST_UPDATED",
				toStatus: "UNEXPORTED",
			});
		});

		test("should handle zero images case", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(imagesCommandRepository.bulkUpdateStatus).mockResolvedValue({
				count: 0,
			});

			const result = await batchService.revertImages(userId);

			expect(result.count).toBe(0);
		});
	});
});

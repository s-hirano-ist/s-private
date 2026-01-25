import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeUserId } from "../../shared-kernel/entities/common-entity";
import type { IBatchCommandRepository } from "../../shared-kernel/repositories/batch-command-repository.interface";
import { ImagesBatchDomainService } from "./images-batch-domain-service";

describe("ImagesBatchDomainService", () => {
	let batchCommandRepository: IBatchCommandRepository;
	let batchService: ImagesBatchDomainService;

	beforeEach(() => {
		batchCommandRepository = {
			bulkUpdateStatus: vi.fn(),
			resetStatus: vi.fn(),
		};

		batchService = new ImagesBatchDomainService(batchCommandRepository);
	});

	describe("resetImages", () => {
		test("should delegate to repository's resetStatus method", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(batchCommandRepository.resetStatus).mockResolvedValue({
				finalized: { count: 5 },
				marked: { count: 10 },
			});

			const result = await batchService.resetImages(userId);

			expect(result.finalized.count).toBe(5);
			expect(result.marked.count).toBe(10);

			expect(batchCommandRepository.resetStatus).toHaveBeenCalledWith(
				userId,
				expect.any(Date),
			);
		});

		test("should handle zero images case", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(batchCommandRepository.resetStatus).mockResolvedValue({
				finalized: { count: 0 },
				marked: { count: 0 },
			});

			const result = await batchService.resetImages(userId);

			expect(result.finalized.count).toBe(0);
			expect(result.marked.count).toBe(0);
		});
	});

	describe("revertImages", () => {
		test("should revert LAST_UPDATED images to UNEXPORTED", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(batchCommandRepository.bulkUpdateStatus).mockResolvedValue({
				count: 7,
			});

			const result = await batchService.revertImages(userId);

			expect(result.count).toBe(7);
			expect(batchCommandRepository.bulkUpdateStatus).toHaveBeenCalledWith({
				userId,
				fromStatus: "LAST_UPDATED",
				toStatus: "UNEXPORTED",
			});
		});

		test("should handle zero images case", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(batchCommandRepository.bulkUpdateStatus).mockResolvedValue({
				count: 0,
			});

			const result = await batchService.revertImages(userId);

			expect(result.count).toBe(0);
		});
	});
});

import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeUserId } from "../../common/entities/common-entity";
import type { IBooksCommandRepository } from "../repositories/books-command-repository.interface";
import { BooksBatchDomainService } from "./books-batch-domain-service";

describe("BooksBatchDomainService", () => {
	let booksCommandRepository: IBooksCommandRepository;
	let batchService: BooksBatchDomainService;

	beforeEach(() => {
		booksCommandRepository = {
			create: vi.fn(),
			deleteById: vi.fn(),
			fetchBookFromGitHub: vi.fn(),
			bulkUpdateStatus: vi.fn(),
		} as IBooksCommandRepository;

		batchService = new BooksBatchDomainService(booksCommandRepository);
	});

	describe("resetBooks", () => {
		test("should finalize LAST_UPDATED books and mark UNEXPORTED books", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(booksCommandRepository.bulkUpdateStatus)
				.mockResolvedValueOnce({ count: 5 })
				.mockResolvedValueOnce({ count: 10 });

			const result = await batchService.resetBooks(userId);

			expect(result.finalized.count).toBe(5);
			expect(result.marked.count).toBe(10);

			expect(booksCommandRepository.bulkUpdateStatus).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					userId,
					fromStatus: "LAST_UPDATED",
					toStatus: "EXPORTED",
					exportedAt: expect.any(Date),
				}),
			);

			expect(booksCommandRepository.bulkUpdateStatus).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					userId,
					fromStatus: "UNEXPORTED",
					toStatus: "LAST_UPDATED",
				}),
			);
		});

		test("should handle zero books case", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(booksCommandRepository.bulkUpdateStatus)
				.mockResolvedValueOnce({ count: 0 })
				.mockResolvedValueOnce({ count: 0 });

			const result = await batchService.resetBooks(userId);

			expect(result.finalized.count).toBe(0);
			expect(result.marked.count).toBe(0);
		});
	});

	describe("revertBooks", () => {
		test("should revert LAST_UPDATED books to UNEXPORTED", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(booksCommandRepository.bulkUpdateStatus).mockResolvedValue({
				count: 7,
			});

			const result = await batchService.revertBooks(userId);

			expect(result.count).toBe(7);
			expect(booksCommandRepository.bulkUpdateStatus).toHaveBeenCalledWith({
				userId,
				fromStatus: "LAST_UPDATED",
				toStatus: "UNEXPORTED",
			});
		});

		test("should handle zero books case", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(booksCommandRepository.bulkUpdateStatus).mockResolvedValue({
				count: 0,
			});

			const result = await batchService.revertBooks(userId);

			expect(result.count).toBe(0);
		});
	});
});

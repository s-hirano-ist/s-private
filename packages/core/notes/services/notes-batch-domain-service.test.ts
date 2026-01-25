import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeUserId } from "../../shared-kernel/entities/common-entity";
import type { INotesCommandRepository } from "../repositories/notes-command-repository.interface";
import { NotesBatchDomainService } from "./notes-batch-domain-service";

describe("NotesBatchDomainService", () => {
	let notesCommandRepository: INotesCommandRepository;
	let batchService: NotesBatchDomainService;

	beforeEach(() => {
		notesCommandRepository = {
			create: vi.fn(),
			deleteById: vi.fn(),
			bulkUpdateStatus: vi.fn(),
		} as INotesCommandRepository;

		batchService = new NotesBatchDomainService(notesCommandRepository);
	});

	describe("resetNotes", () => {
		test("should finalize LAST_UPDATED notes and mark UNEXPORTED notes", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(notesCommandRepository.bulkUpdateStatus)
				.mockResolvedValueOnce({ count: 5 })
				.mockResolvedValueOnce({ count: 10 });

			const result = await batchService.resetNotes(userId);

			expect(result.finalized.count).toBe(5);
			expect(result.marked.count).toBe(10);

			expect(notesCommandRepository.bulkUpdateStatus).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					userId,
					fromStatus: "LAST_UPDATED",
					toStatus: "EXPORTED",
					exportedAt: expect.any(Date),
				}),
			);

			expect(notesCommandRepository.bulkUpdateStatus).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					userId,
					fromStatus: "UNEXPORTED",
					toStatus: "LAST_UPDATED",
				}),
			);
		});

		test("should handle zero notes case", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(notesCommandRepository.bulkUpdateStatus)
				.mockResolvedValueOnce({ count: 0 })
				.mockResolvedValueOnce({ count: 0 });

			const result = await batchService.resetNotes(userId);

			expect(result.finalized.count).toBe(0);
			expect(result.marked.count).toBe(0);
		});
	});

	describe("revertNotes", () => {
		test("should revert LAST_UPDATED notes to UNEXPORTED", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(notesCommandRepository.bulkUpdateStatus).mockResolvedValue({
				count: 7,
			});

			const result = await batchService.revertNotes(userId);

			expect(result.count).toBe(7);
			expect(notesCommandRepository.bulkUpdateStatus).toHaveBeenCalledWith({
				userId,
				fromStatus: "LAST_UPDATED",
				toStatus: "UNEXPORTED",
			});
		});

		test("should handle zero notes case", async () => {
			const userId = makeUserId("test-user-id");

			vi.mocked(notesCommandRepository.bulkUpdateStatus).mockResolvedValue({
				count: 0,
			});

			const result = await batchService.revertNotes(userId);

			expect(result.count).toBe(0);
		});
	});
});

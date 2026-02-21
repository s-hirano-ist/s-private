import { makeNoteTitle } from "@s-hirano-ist/s-core/notes/entities/note-entity";
import type { INotesCommandRepository } from "@s-hirano-ist/s-core/notes/repositories/notes-command-repository.interface";
import {
	makeId,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { deleteNote } from "./delete-note";
import { deleteNoteCore } from "./delete-note.core";
import type { DeleteNoteDeps } from "./delete-note.deps";

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	hasDumperPostPermission: vi.fn(),
}));

function createMockDeps(): {
	deps: DeleteNoteDeps;
	mockCommandRepository: INotesCommandRepository;
	mockEventDispatcher: { dispatch: ReturnType<typeof vi.fn> };
} {
	const mockCommandRepository: INotesCommandRepository = {
		create: vi.fn(),
		deleteById: vi.fn(),
	};

	const mockEventDispatcher = {
		dispatch: vi.fn().mockResolvedValue(undefined),
	};

	const deps: DeleteNoteDeps = {
		commandRepository: mockCommandRepository,
		eventDispatcher: mockEventDispatcher,
	};

	return { deps, mockCommandRepository, mockEventDispatcher };
}

describe("deleteNoteCore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should delete note successfully", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("test-user-id"));

		const { deps, mockCommandRepository, mockEventDispatcher } =
			createMockDeps();
		vi.mocked(mockCommandRepository.deleteById).mockResolvedValue({
			title: makeNoteTitle("Test Note"),
		});

		const testId = makeId("01234567-89ab-7def-8123-456789abcdef");
		const result = await deleteNoteCore(testId, deps);

		expect(result).toEqual({
			success: true,
			message: "deleted",
		});
		expect(mockCommandRepository.deleteById).toHaveBeenCalledWith(
			testId,
			makeUserId("test-user-id"),
			makeUnexportedStatus(),
		);
		expect(mockEventDispatcher.dispatch).toHaveBeenCalled();
	});

	test("should return error when note not found", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("test-user-id"));

		const { deps, mockCommandRepository } = createMockDeps();
		const mockError = new Error("Record not found");
		vi.mocked(mockCommandRepository.deleteById).mockRejectedValue(mockError);

		const testId = makeId("01234567-89ab-7def-8123-456789abcde0");
		const result = await deleteNoteCore(testId, deps);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
		expect(mockCommandRepository.deleteById).toHaveBeenCalledWith(
			testId,
			makeUserId("test-user-id"),
			makeUnexportedStatus(),
		);
	});

	test("should return error when getSelfId fails", async () => {
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));

		const { deps } = createMockDeps();
		const testId = makeId("01234567-89ab-7def-8123-456789abcdef");
		const result = await deleteNoteCore(testId, deps);

		expect(result.success).toBe(false);
	});
});

describe("deleteNote (Server Action)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should call forbidden when user lacks permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		const testId = "01234567-89ab-7def-8123-456789abcde1";

		await expect(deleteNote(testId)).rejects.toThrow("FORBIDDEN");
	});

	test("should call deleteNoteCore with default deps when permitted", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));

		const testId = "01234567-89ab-7def-8123-456789abcdef";
		const result = await deleteNote(testId);

		expect(hasDumperPostPermission).toHaveBeenCalled();
		expect(result.success).toBe(false);
	});
});

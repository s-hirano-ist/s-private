import {
	makeId,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { revalidateTag } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { deleteNote } from "@/application-services/notes/delete-note";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import { notesCommandRepository } from "@/infrastructures/notes/repositories/notes-command-repository";

vi.mock(
	"@/infrastructures/notes/repositories/notes-command-repository",
	() => ({
		notesCommandRepository: {
			deleteById: vi.fn(),
		},
	}),
);

vi.mock("@/infrastructures/events/event-dispatcher", () => ({
	eventDispatcher: {
		dispatch: vi.fn().mockResolvedValue(undefined),
	},
}));

vi.mock("@/common/error/error-wrapper", () => ({
	wrapServerSideErrorForClient: vi.fn(),
}));

const mockGetSelfId = vi.fn();
const mockHasDumperPostPermission = vi.fn();

vi.mock("@/common/auth/session", () => ({
	getSelfId: () => mockGetSelfId(),
	hasDumperPostPermission: () => mockHasDumperPostPermission(),
}));

describe("deleteNote", () => {
	test("should delete note successfully", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("test-user-id");

		vi.mocked(notesCommandRepository.deleteById).mockResolvedValueOnce({
			title: "Test Note",
		});

		const testId = "01234567-89ab-7def-8123-456789abcdef";
		const result = await deleteNote(testId);

		expect(result).toEqual({
			success: true,
			message: "deleted",
		});

		expect(notesCommandRepository.deleteById).toHaveBeenCalledWith(
			makeId(testId),
			makeUserId("test-user-id"),
			"UNEXPORTED",
		);
		const status = makeUnexportedStatus();
		expect(revalidateTag).toHaveBeenCalledWith(
			buildContentCacheTag("notes", status, "test-user-id"),
		);
		expect(revalidateTag).toHaveBeenCalledWith(
			buildCountCacheTag("notes", status, "test-user-id"),
		);
	});

	test("should return error when note not found", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("test-user-id");

		const mockError = new Error("Record not found");
		vi.mocked(notesCommandRepository.deleteById).mockRejectedValue(mockError);
		vi.mocked(wrapServerSideErrorForClient).mockResolvedValue({
			success: false,
			message: "unexpected",
		});

		const testId = "01234567-89ab-7def-8123-456789abcde0";
		const result = await deleteNote(testId);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
		expect(notesCommandRepository.deleteById).toHaveBeenCalledWith(
			makeId(testId),
			makeUserId("test-user-id"),
			"UNEXPORTED",
		);
		expect(wrapServerSideErrorForClient).toHaveBeenCalledWith(mockError);
	});

	test("should call forbidden when user lacks permission", async () => {
		mockHasDumperPostPermission.mockResolvedValue(false);

		const testId = "01234567-89ab-7def-8123-456789abcde1";
		await expect(deleteNote(testId)).rejects.toThrow("FORBIDDEN");
	});
});

import { revalidateTag } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { deleteContents } from "@/application-services/contents/delete-contents";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import {
	makeId,
	makeStatus,
	makeUserId,
} from "@/domains/common/entities/common-entity";
import { contentsCommandRepository } from "@/infrastructures/contents/repositories/contents-command-repository";

vi.mock(
	"@/infrastructures/contents/repositories/contents-command-repository",
	() => ({
		contentsCommandRepository: {
			deleteById: vi.fn(),
		},
	}),
);

vi.mock("@/common/error/error-wrapper", () => ({
	wrapServerSideErrorForClient: vi.fn(),
}));

const mockGetSelfId = vi.fn();
const mockHasDumperPostPermission = vi.fn();

vi.mock("@/common/auth/session", () => ({
	getSelfId: () => mockGetSelfId(),
	hasDumperPostPermission: () => mockHasDumperPostPermission(),
}));

describe("deleteContents", () => {
	test("should delete contents successfully", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("test-user-id");

		vi.mocked(contentsCommandRepository.deleteById).mockResolvedValueOnce(
			undefined,
		);

		const testId = "01234567-89ab-7def-8123-456789abcdef";
		const result = await deleteContents(testId);

		expect(result).toEqual({
			success: true,
			message: "deleted",
		});

		expect(contentsCommandRepository.deleteById).toHaveBeenCalledWith(
			makeId(testId),
			makeUserId("test-user-id"),
			makeStatus("UNEXPORTED"),
		);
		expect(revalidateTag).toHaveBeenCalledWith(
			"contents_UNEXPORTED_test-user-id",
		);
		expect(revalidateTag).toHaveBeenCalledWith(
			"contents_count_UNEXPORTED_test-user-id",
		);
	});

	test("should return error when contents not found", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("test-user-id");

		const mockError = new Error("Record not found");
		vi.mocked(contentsCommandRepository.deleteById).mockRejectedValue(
			mockError,
		);
		vi.mocked(wrapServerSideErrorForClient).mockResolvedValue({
			success: false,
			message: "unexpected",
		});

		const testId = "01234567-89ab-7def-8123-456789abcde0";
		const result = await deleteContents(testId);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
		expect(contentsCommandRepository.deleteById).toHaveBeenCalledWith(
			makeId(testId),
			makeUserId("test-user-id"),
			makeStatus("UNEXPORTED"),
		);
		expect(wrapServerSideErrorForClient).toHaveBeenCalledWith(mockError);
	});

	test("should call forbidden when user lacks permission", async () => {
		mockHasDumperPostPermission.mockResolvedValue(false);

		const testId = "01234567-89ab-7def-8123-456789abcde1";
		await expect(deleteContents(testId)).rejects.toThrow("FORBIDDEN");
	});
});

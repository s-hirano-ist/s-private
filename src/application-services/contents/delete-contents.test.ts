import { revalidateTag } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { deleteContents } from "@/application-services/contents/delete-contents";
import { contentsCommandRepository } from "@/infrastructures/contents/repositories/contents-command-repository";

vi.mock(
	"@/infrastructures/contents/repositories/contents-command-repository",
	() => ({
		contentsCommandRepository: {
			deleteById: vi.fn(),
		},
	}),
);

const mockGetSelfId = vi.fn();
const mockHasDumperPostPermission = vi.fn();

vi.mock("@/common/auth/session", () => ({
	getSelfId: () => mockGetSelfId(),
	hasDumperPostPermission: () => mockHasDumperPostPermission(),
}));

describe("deleteContents", () => {
	test("should delete contents successfully", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("1");

		vi.mocked(contentsCommandRepository.deleteById).mockResolvedValueOnce();

		const result = await deleteContents("1");

		expect(result).toEqual({
			success: true,
			message: "deleted",
		});

		expect(contentsCommandRepository.deleteById).toHaveBeenCalledWith(
			"1",
			"1",
			"UNEXPORTED",
		);
		expect(revalidateTag).toHaveBeenCalledWith("contents_UNEXPORTED");
	});

	test("should return error when contents not found", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("1");

		vi.mocked(contentsCommandRepository.deleteById).mockRejectedValue(
			new Error("Record not found"),
		);

		const result = await deleteContents("999");

		expect(result.success).toBe(false);
		expect(result.message).toBe("unexpected");
		expect(contentsCommandRepository.deleteById).toHaveBeenCalledWith(
			"999",
			"1",
			"UNEXPORTED",
		);
	});
});

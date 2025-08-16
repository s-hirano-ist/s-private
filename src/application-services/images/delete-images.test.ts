import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { deleteImages } from "@/application-services/images/delete-images";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";

vi.mock(
	"@/infrastructures/images/repositories/images-command-repository",
	() => ({ imagesCommandRepository: { deleteById: vi.fn() } }),
);

const mockGetSelfId = vi.fn();
const mockHasDumperPostPermission = vi.fn();

vi.mock("@/common/auth/session", () => ({
	getSelfId: () => mockGetSelfId(),
	hasDumperPostPermission: () => mockHasDumperPostPermission(),
}));

describe("deleteImages", () => {
	test("should delete images successfully", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("1");

		vi.mocked(imagesCommandRepository.deleteById).mockResolvedValueOnce();

		const result = await deleteImages("1");

		expect(result).toEqual({
			success: true,
			message: "deleted",
		});

		expect(imagesCommandRepository.deleteById).toHaveBeenCalledWith(
			"1",
			"1",
			"UNEXPORTED",
		);
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
	});

	test("should return error when images not found", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("1");

		vi.mocked(imagesCommandRepository.deleteById).mockRejectedValue(
			new Error("Record not found"),
		);

		const result = await deleteImages("999");

		expect(result.success).toBe(false);
		expect(result.message).toBe("unexpected");
		expect(imagesCommandRepository.deleteById).toHaveBeenCalledWith(
			"999",
			"1",
			"UNEXPORTED",
		);
	});
});

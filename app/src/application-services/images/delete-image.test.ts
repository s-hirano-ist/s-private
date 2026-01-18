import { describe, expect, test, vi } from "vitest";
import { deleteImage } from "@/application-services/images/delete-image";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";

vi.mock(
	"@/infrastructures/images/repositories/images-command-repository",
	() => ({ imagesCommandRepository: { deleteById: vi.fn() } }),
);

vi.mock("@/infrastructures/events/event-dispatcher", () => ({
	eventDispatcher: {
		dispatch: vi.fn().mockResolvedValue(undefined),
	},
}));

const mockGetSelfId = vi.fn();
const mockHasDumperPostPermission = vi.fn();

vi.mock("@/common/auth/session", () => ({
	getSelfId: () => mockGetSelfId(),
	hasDumperPostPermission: () => mockHasDumperPostPermission(),
}));

describe("deleteImage", () => {
	test("should delete images successfully", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("1");

		vi.mocked(imagesCommandRepository.deleteById).mockResolvedValueOnce({
			path: "test-image.jpg",
		});

		const result = await deleteImage("1");

		expect(result).toEqual({
			success: true,
			message: "deleted",
		});

		expect(imagesCommandRepository.deleteById).toHaveBeenCalledWith(
			"1",
			"1",
			"UNEXPORTED",
		);
	});

	test("should return error when images not found", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("1");

		vi.mocked(imagesCommandRepository.deleteById).mockRejectedValue(
			new Error("Record not found"),
		);

		const result = await deleteImage("999");

		expect(result.success).toBe(false);
		expect(result.message).toBe("unexpected");
		expect(imagesCommandRepository.deleteById).toHaveBeenCalledWith(
			"999",
			"1",
			"UNEXPORTED",
		);
	});
});

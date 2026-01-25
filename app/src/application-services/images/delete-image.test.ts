import {
	makeId,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
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

// Test UUIDs (UUIDv7 format)
const TEST_IMAGE_ID = "01234567-89ab-7def-8123-456789abcdef";
const TEST_NOT_FOUND_ID = "01234567-89ab-7def-8123-456789abcde0";
const TEST_USER_ID = "test-user-id";

describe("deleteImage", () => {
	test("should delete images successfully", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue(makeUserId(TEST_USER_ID));

		vi.mocked(imagesCommandRepository.deleteById).mockResolvedValueOnce({
			path: "test-image.jpg",
		});

		const result = await deleteImage(TEST_IMAGE_ID);

		expect(result).toEqual({
			success: true,
			message: "deleted",
		});

		expect(imagesCommandRepository.deleteById).toHaveBeenCalledWith(
			makeId(TEST_IMAGE_ID),
			makeUserId(TEST_USER_ID),
			makeUnexportedStatus(),
		);
	});

	test("should return error when images not found", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue(makeUserId(TEST_USER_ID));

		vi.mocked(imagesCommandRepository.deleteById).mockRejectedValue(
			new Error("Record not found"),
		);

		const result = await deleteImage(TEST_NOT_FOUND_ID);

		expect(result.success).toBe(false);
		expect(result.message).toBe("unexpected");
		expect(imagesCommandRepository.deleteById).toHaveBeenCalledWith(
			makeId(TEST_NOT_FOUND_ID),
			makeUserId(TEST_USER_ID),
			makeUnexportedStatus(),
		);
	});
});

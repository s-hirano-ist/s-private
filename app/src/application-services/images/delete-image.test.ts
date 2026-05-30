import type { DeleteImageDeps } from "./delete-image.deps";
import type { IImagesCommandRepository } from "@s-hirano-ist/s-core/images/repositories/images-command-repository.interface";
import { getSelfId, requireAuth } from "@/common/auth/session";
import {
	makeId,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { deleteImage } from "./delete-image";
import { deleteImageCore } from "./delete-image.core";

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	requireAuth: vi.fn(),
}));

function createMockDeps(): {
	deps: DeleteImageDeps;
	mockCommandRepository: IImagesCommandRepository;
	mockEventDispatcher: { dispatch: ReturnType<typeof vi.fn> };
} {
	const mockCommandRepository: IImagesCommandRepository = {
		create: vi.fn(),
		deleteById: vi.fn(),
	};

	const mockEventDispatcher = {
		dispatch: vi.fn().mockResolvedValue(undefined),
	};

	const deps: DeleteImageDeps = {
		commandRepository: mockCommandRepository,
		eventDispatcher: mockEventDispatcher,
	};

	return { deps, mockCommandRepository, mockEventDispatcher };
}

describe("deleteImageCore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should delete image successfully", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("test-user-id"));

		const { deps, mockCommandRepository, mockEventDispatcher } =
			createMockDeps();
		vi.mocked(mockCommandRepository.deleteById).mockResolvedValue({
			path: "test-image.jpg",
		});

		const testId = makeId("01234567-89ab-7def-8123-456789abcdef");
		const result = await deleteImageCore(testId, deps);

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

	test("should return error when image not found", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("test-user-id"));

		const { deps, mockCommandRepository } = createMockDeps();
		vi.mocked(mockCommandRepository.deleteById).mockRejectedValue(
			new Error("Record not found"),
		);

		const testId = makeId("01234567-89ab-7def-8123-456789abcde0");
		const result = await deleteImageCore(testId, deps);

		expect(result.success).toBe(false);
		expect(result.message).toBe("unexpected");
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
		const result = await deleteImageCore(testId, deps);

		expect(result.success).toBe(false);
	});
});

describe("deleteImage (Server Action)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should call deleteImageCore with default deps when authenticated", async () => {
		vi.mocked(requireAuth).mockResolvedValue(undefined);
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));

		const testId = "01234567-89ab-7def-8123-456789abcdef";
		const result = await deleteImage(testId);

		expect(requireAuth).toHaveBeenCalled();
		expect(result.success).toBe(false);
	});
});

import { makeBookTitle } from "@s-hirano-ist/s-core/books/entities/book-entity";
import type { IBooksCommandRepository } from "@s-hirano-ist/s-core/books/repositories/books-command-repository.interface";
import {
	makeId,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { deleteBooks } from "./delete-books";
import { deleteBooksCore } from "./delete-books.core";
import type { DeleteBooksDeps } from "./delete-books.deps";

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	hasDumperPostPermission: vi.fn(),
}));

function createMockDeps(): {
	deps: DeleteBooksDeps;
	mockCommandRepository: IBooksCommandRepository;
	mockEventDispatcher: { dispatch: ReturnType<typeof vi.fn> };
} {
	const mockCommandRepository: IBooksCommandRepository = {
		create: vi.fn(),
		deleteById: vi.fn(),
	};

	const mockEventDispatcher = {
		dispatch: vi.fn().mockResolvedValue(undefined),
	};

	const deps: DeleteBooksDeps = {
		commandRepository: mockCommandRepository,
		eventDispatcher: mockEventDispatcher,
	};

	return { deps, mockCommandRepository, mockEventDispatcher };
}

describe("deleteBooksCore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should delete book successfully", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("test-user-id"));

		const { deps, mockCommandRepository, mockEventDispatcher } =
			createMockDeps();
		vi.mocked(mockCommandRepository.deleteById).mockResolvedValue({
			title: makeBookTitle("Test Book"),
		});

		const testId = "01933f5c-9df0-7001-9123-456789abcdef";
		const result = await deleteBooksCore(testId, deps);

		expect(result).toEqual({
			success: true,
			message: "deleted",
		});
		expect(mockCommandRepository.deleteById).toHaveBeenCalledWith(
			makeId(testId),
			makeUserId("test-user-id"),
			makeUnexportedStatus(),
		);
		expect(mockEventDispatcher.dispatch).toHaveBeenCalled();
	});

	test("should return error when book not found", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("test-user-id"));

		const { deps, mockCommandRepository } = createMockDeps();
		const mockError = new Error("Record not found");
		vi.mocked(mockCommandRepository.deleteById).mockRejectedValue(mockError);

		const testId = "01933f5c-9df0-7001-9123-456789abcde0";
		const result = await deleteBooksCore(testId, deps);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
		expect(mockCommandRepository.deleteById).toHaveBeenCalledWith(
			makeId(testId),
			makeUserId("test-user-id"),
			makeUnexportedStatus(),
		);
	});

	test("should return error when getSelfId fails", async () => {
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));

		const { deps } = createMockDeps();
		const testId = "01933f5c-9df0-7001-9123-456789abcdef";
		const result = await deleteBooksCore(testId, deps);

		expect(result.success).toBe(false);
	});
});

describe("deleteBooks (Server Action)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should call forbidden when user lacks permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		const testId = "01933f5c-9df0-7001-9123-456789abcde1";

		await expect(deleteBooks(testId)).rejects.toThrow("FORBIDDEN");
	});

	test("should call deleteBooksCore with default deps when permitted", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));

		const testId = "01933f5c-9df0-7001-9123-456789abcdef";
		const result = await deleteBooks(testId);

		expect(hasDumperPostPermission).toHaveBeenCalled();
		expect(result.success).toBe(false);
	});
});

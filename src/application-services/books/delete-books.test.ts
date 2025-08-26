import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";
import * as sessionModule from "@/common/auth/session";
import * as errorModule from "@/common/error/error-wrapper";
import * as commonEntityModule from "@/domains/common/entities/common-entity";
import * as booksRepositoryModule from "@/infrastructures/books/repositories/books-command-repository";
import { deleteBooks } from "./delete-books";

vi.mock("@/common/auth/session");
vi.mock("@/common/error/error-wrapper");
vi.mock("@/infrastructures/books/repositories/books-command-repository");
vi.mock("@/domains/common/entities/common-entity");

const mockDeleteById = vi.fn();

describe("deleteBooks", () => {
	const mockHasDumperPostPermission =
		sessionModule.hasDumperPostPermission as Mock;
	const mockGetSelfId = sessionModule.getSelfId as Mock;
	const mockWrapServerSideErrorForClient =
		errorModule.wrapServerSideErrorForClient as Mock;
	const mockMakeId = commonEntityModule.makeId as Mock;
	const mockMakeUserId = commonEntityModule.makeUserId as Mock;
	const mockMakeUnexportedStatus =
		commonEntityModule.makeUnexportedStatus as Mock;

	beforeEach(() => {
		vi.clearAllMocks();
		booksRepositoryModule.booksCommandRepository.deleteById = mockDeleteById;

		mockMakeId.mockImplementation((id) => id);
		mockMakeUserId.mockImplementation((userId) => userId);
		mockMakeUnexportedStatus.mockImplementation(() => "UNEXPORTED");
	});

	test("should successfully delete a book when user has permission", async () => {
		const bookId = "01933f5c-9df0-7001-9123-456789abcdef";
		const userId = "01933f5c-9df0-7002-9876-543210fedcba";

		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue(userId);
		mockDeleteById.mockResolvedValue(undefined);

		const result = await deleteBooks(bookId);

		expect(mockDeleteById).toHaveBeenCalledWith(bookId, userId, "UNEXPORTED");
		expect(result).toEqual({ success: true, message: "deleted" });
	});

	test("should throw forbidden error when user lacks permission", async () => {
		mockHasDumperPostPermission.mockResolvedValue(false);

		await expect(
			deleteBooks("01933f5c-9df0-7001-9123-456789abcdef"),
		).rejects.toThrow();
	});

	test("should handle errors and wrap them properly", async () => {
		const bookId = "01933f5c-9df0-7001-9123-456789abcdef";
		const userId = "01933f5c-9df0-7002-9876-543210fedcba";
		const error = new Error("Test error");
		const wrappedError = { success: false, message: "Error occurred" };

		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue(userId);
		mockDeleteById.mockRejectedValue(error);
		mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

		const result = await deleteBooks(bookId);

		expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
		expect(result).toEqual(wrappedError);
	});
});

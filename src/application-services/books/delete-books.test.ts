import { beforeEach, describe, expect, Mock, test, vi } from "vitest";
import * as sessionModule from "@/common/auth/session";
import * as errorModule from "@/common/error/error-wrapper";
import * as booksRepositoryModule from "@/infrastructures/books/repositories/books-command-repository";
import { deleteBooks } from "./delete-books";

vi.mock("@/common/auth/session");
vi.mock("@/common/error/error-wrapper");
vi.mock("@/infrastructures/books/repositories/books-command-repository");

const mockDeleteById = vi.fn();

describe("deleteBooks", () => {
	const mockHasDumperPostPermission =
		sessionModule.hasDumperPostPermission as Mock;
	const mockGetSelfId = sessionModule.getSelfId as Mock;
	const mockWrapServerSideErrorForClient =
		errorModule.wrapServerSideErrorForClient as Mock;

	beforeEach(() => {
		vi.clearAllMocks();
		booksRepositoryModule.booksCommandRepository.deleteById = mockDeleteById;
	});

	test("should successfully delete a book when user has permission", async () => {
		const bookId = "test-book-id";
		const userId = "test-user-id";

		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue(userId);
		mockDeleteById.mockResolvedValue(undefined);

		const result = await deleteBooks(bookId);

		expect(mockDeleteById).toHaveBeenCalledWith(bookId, userId, "UNEXPORTED");
		expect(result).toEqual({ success: true, message: "deleted" });
	});

	test("should throw forbidden error when user lacks permission", async () => {
		mockHasDumperPostPermission.mockResolvedValue(false);

		await expect(deleteBooks("test-id")).rejects.toThrow();
	});

	test("should handle errors and wrap them properly", async () => {
		const bookId = "test-book-id";
		const userId = "test-user-id";
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

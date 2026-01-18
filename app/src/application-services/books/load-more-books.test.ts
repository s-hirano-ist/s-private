import {
	makeExportedStatus,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/common/entities/common-entity";
import { forbidden } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import { _getBooks } from "./get-books";
import {
	loadMoreExportedBooks,
	loadMoreUnexportedBooks,
} from "./get-books-from-client";

vi.mock("next/navigation");
vi.mock("@/common/auth/session");
vi.mock("@/common/error/error-wrapper");
vi.mock("@/common/utils/cache-utils");
vi.mock(
	"@s-hirano-ist/s-core/common/entities/common-entity",
	async (importOriginal) => {
		const actual =
			await importOriginal<
				typeof import("@s-hirano-ist/s-core/common/entities/common-entity")
			>();
		return {
			...actual,
			makeExportedStatus: vi.fn(),
			makeUnexportedStatus: vi.fn(),
		};
	},
);
vi.mock("./get-books");

const mockHasViewerAdminPermission = vi.mocked(hasViewerAdminPermission);
const mockGetSelfId = vi.mocked(getSelfId);
const mockForbidden = vi.mocked(forbidden);
const mockWrapServerSideErrorForClient = vi.mocked(
	wrapServerSideErrorForClient,
);
const mockSanitizeCacheTag = vi.mocked(sanitizeCacheTag);
const mockMakeExportedStatus = vi.mocked(makeExportedStatus);
const mockMakeUnexportedStatus = vi.mocked(makeUnexportedStatus);
const mock_getBooks = vi.mocked(_getBooks);

describe("get-books-from-client", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("loadMoreExportedBooks", () => {
		test("should return success result when user has permission", async () => {
			const mockData = { data: [], totalCount: 15 };
			const currentCount = 10;
			const userId = makeUserId("test-user-id");

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetSelfId.mockResolvedValue(userId);
			mockMakeExportedStatus.mockReturnValue({ status: "EXPORTED" } as any);
			mockSanitizeCacheTag.mockReturnValue("test-user-id");
			mock_getBooks.mockResolvedValue(mockData);

			const result = await loadMoreExportedBooks(currentCount);

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockGetSelfId).toHaveBeenCalledOnce();
			expect(mockMakeExportedStatus).toHaveBeenCalledOnce();
			expect(mockSanitizeCacheTag).toHaveBeenCalledWith(userId);
			expect(mock_getBooks).toHaveBeenCalledWith(
				currentCount,
				userId,
				"EXPORTED",
				{
					ttl: 400,
					swr: 40,
					tags: [`test-user-id_books_${currentCount}`],
				},
			);
			expect(result).toEqual({
				success: true,
				message: "success",
				data: mockData,
			});
		});

		test("should call forbidden when user has no permission", async () => {
			mockHasViewerAdminPermission.mockResolvedValue(false);
			mockForbidden.mockImplementation(() => {
				throw new Error("FORBIDDEN");
			});

			await expect(loadMoreExportedBooks(10)).rejects.toThrow("FORBIDDEN");

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockForbidden).toHaveBeenCalledOnce();
			expect(mockGetSelfId).not.toHaveBeenCalled();
		});

		test("should handle error and wrap it", async () => {
			const error = new Error("Database error");
			const wrappedError = { success: false, message: "error" };

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetSelfId.mockResolvedValue(makeUserId("user-id"));
			mockMakeExportedStatus.mockReturnValue({ status: "EXPORTED" } as any);
			mockSanitizeCacheTag.mockReturnValue("user-id");
			mock_getBooks.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreExportedBooks(10);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});

	describe("loadMoreUnexportedBooks", () => {
		test("should return success result when user has permission", async () => {
			const mockData = { data: [], totalCount: 12 };
			const currentCount = 5;
			const userId = makeUserId("test-user-id-2");

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetSelfId.mockResolvedValue(userId);
			mockMakeUnexportedStatus.mockReturnValue("UNEXPORTED" as any);
			mock_getBooks.mockResolvedValue(mockData);

			const result = await loadMoreUnexportedBooks(currentCount);

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockGetSelfId).toHaveBeenCalledOnce();
			expect(mockMakeUnexportedStatus).toHaveBeenCalledOnce();
			expect(mock_getBooks).toHaveBeenCalledWith(
				currentCount,
				userId,
				"UNEXPORTED",
			);
			expect(result).toEqual({
				success: true,
				message: "success",
				data: mockData,
			});
		});

		test("should call forbidden when user has no permission", async () => {
			mockHasViewerAdminPermission.mockResolvedValue(false);
			mockForbidden.mockImplementation(() => {
				throw new Error("FORBIDDEN");
			});

			await expect(loadMoreUnexportedBooks(5)).rejects.toThrow("FORBIDDEN");

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockForbidden).toHaveBeenCalledOnce();
			expect(mockGetSelfId).not.toHaveBeenCalled();
		});

		test("should handle error and wrap it", async () => {
			const error = new Error("Network error");
			const wrappedError = { success: false, message: "networkError" };

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetSelfId.mockResolvedValue(makeUserId("user-id-2"));
			mockMakeUnexportedStatus.mockReturnValue("UNEXPORTED" as any);
			mock_getBooks.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreUnexportedBooks(5);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});
});

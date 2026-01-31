import { forbidden } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { getExportedBooks, getUnexportedBooks } from "./get-books";
import {
	loadMoreExportedBooks,
	loadMoreUnexportedBooks,
} from "./load-more-books";

vi.mock("next/navigation");
vi.mock("@/common/auth/session");
vi.mock("@/common/error/error-wrapper");
vi.mock("./get-books");

const mockHasViewerAdminPermission = vi.mocked(hasViewerAdminPermission);
const mockForbidden = vi.mocked(forbidden);
const mockWrapServerSideErrorForClient = vi.mocked(
	wrapServerSideErrorForClient,
);
const mockGetExportedBooks = vi.mocked(getExportedBooks);
const mockGetUnexportedBooks = vi.mocked(getUnexportedBooks);

describe("load-more-books", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("loadMoreExportedBooks", () => {
		test("should return success result when user has permission", async () => {
			const mockData = { data: [], totalCount: 15 };
			const currentCount = 10;

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetExportedBooks.mockResolvedValue(mockData);

			const result = await loadMoreExportedBooks(currentCount);

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockGetExportedBooks).toHaveBeenCalledWith(currentCount);
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
			expect(mockGetExportedBooks).not.toHaveBeenCalled();
		});

		test("should handle error and wrap it", async () => {
			const error = new Error("Database error");
			const wrappedError = { success: false, message: "error" };

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetExportedBooks.mockRejectedValue(error);
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

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetUnexportedBooks.mockResolvedValue(mockData);

			const result = await loadMoreUnexportedBooks(currentCount);

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockGetUnexportedBooks).toHaveBeenCalledWith(currentCount);
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
			expect(mockGetUnexportedBooks).not.toHaveBeenCalled();
		});

		test("should handle error and wrap it", async () => {
			const error = new Error("Network error");
			const wrappedError = { success: false, message: "networkError" };

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetUnexportedBooks.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreUnexportedBooks(5);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});
});

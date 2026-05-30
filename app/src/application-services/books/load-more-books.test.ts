import { requireAuth } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getExportedBooks, getUnexportedBooks } from "./get-books";
import {
	loadMoreExportedBooks,
	loadMoreUnexportedBooks,
} from "./load-more-books";

vi.mock("@/common/auth/session");
vi.mock("@/common/error/error-wrapper");
vi.mock("./get-books");

const mockRequireAuth = vi.mocked(requireAuth);
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
		test("should return success result when authenticated", async () => {
			const mockData = { data: [], totalCount: 15 };
			const currentCount = 10;

			mockRequireAuth.mockResolvedValue(undefined);
			mockGetExportedBooks.mockResolvedValue(mockData);

			const result = await loadMoreExportedBooks(currentCount);

			expect(mockRequireAuth).toHaveBeenCalledOnce();
			expect(mockGetExportedBooks).toHaveBeenCalledWith(currentCount);
			expect(result).toEqual({
				success: true,
				message: "success",
				data: mockData,
			});
		});
		test("should handle error and wrap it", async () => {
			const error = new Error("Database error");
			const wrappedError = { success: false, message: "error" };

			mockRequireAuth.mockResolvedValue(undefined);
			mockGetExportedBooks.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreExportedBooks(10);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});

	describe("loadMoreUnexportedBooks", () => {
		test("should return success result when authenticated", async () => {
			const mockData = { data: [], totalCount: 12 };
			const currentCount = 5;

			mockRequireAuth.mockResolvedValue(undefined);
			mockGetUnexportedBooks.mockResolvedValue(mockData);

			const result = await loadMoreUnexportedBooks(currentCount);

			expect(mockRequireAuth).toHaveBeenCalledOnce();
			expect(mockGetUnexportedBooks).toHaveBeenCalledWith(currentCount);
			expect(result).toEqual({
				success: true,
				message: "success",
				data: mockData,
			});
		});
		test("should handle error and wrap it", async () => {
			const error = new Error("Network error");
			const wrappedError = { success: false, message: "networkError" };

			mockRequireAuth.mockResolvedValue(undefined);
			mockGetUnexportedBooks.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreUnexportedBooks(5);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});
});

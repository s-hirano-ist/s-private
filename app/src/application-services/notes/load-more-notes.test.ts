import { requireAuth } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getExportedNotes, getUnexportedNotes } from "./get-notes";
import {
	loadMoreExportedNotes,
	loadMoreUnexportedNotes,
} from "./load-more-notes";

vi.mock("@/common/auth/session");
vi.mock("@/common/error/error-wrapper");
vi.mock("./get-notes");

const mockRequireAuth = vi.mocked(requireAuth);
const mockWrapServerSideErrorForClient = vi.mocked(
	wrapServerSideErrorForClient,
);
const mockGetExportedNotes = vi.mocked(getExportedNotes);
const mockGetUnexportedNotes = vi.mocked(getUnexportedNotes);

describe("load-more-notes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("loadMoreExportedNotes", () => {
		test("should return success result when authenticated", async () => {
			const mockData = { data: [], totalCount: 20 };
			const currentCount = 15;

			mockRequireAuth.mockResolvedValue(undefined);
			mockGetExportedNotes.mockResolvedValue(mockData);

			const result = await loadMoreExportedNotes(currentCount);

			expect(mockRequireAuth).toHaveBeenCalledOnce();
			expect(mockGetExportedNotes).toHaveBeenCalledWith(currentCount);
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
			mockGetExportedNotes.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreExportedNotes(15);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});

	describe("loadMoreUnexportedNotes", () => {
		test("should return success result when authenticated", async () => {
			const mockData = { data: [], totalCount: 18 };
			const currentCount = 8;

			mockRequireAuth.mockResolvedValue(undefined);
			mockGetUnexportedNotes.mockResolvedValue(mockData);

			const result = await loadMoreUnexportedNotes(currentCount);

			expect(mockRequireAuth).toHaveBeenCalledOnce();
			expect(mockGetUnexportedNotes).toHaveBeenCalledWith(currentCount);
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
			mockGetUnexportedNotes.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreUnexportedNotes(8);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});
});

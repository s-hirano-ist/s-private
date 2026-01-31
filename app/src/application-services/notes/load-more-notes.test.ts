import { forbidden } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { getExportedNotes, getUnexportedNotes } from "./get-notes";
import {
	loadMoreExportedNotes,
	loadMoreUnexportedNotes,
} from "./load-more-notes";

vi.mock("next/navigation");
vi.mock("@/common/auth/session");
vi.mock("@/common/error/error-wrapper");
vi.mock("./get-notes");

const mockHasViewerAdminPermission = vi.mocked(hasViewerAdminPermission);
const mockForbidden = vi.mocked(forbidden);
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
		test("should return success result when user has permission", async () => {
			const mockData = { data: [], totalCount: 20 };
			const currentCount = 15;

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetExportedNotes.mockResolvedValue(mockData);

			const result = await loadMoreExportedNotes(currentCount);

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockGetExportedNotes).toHaveBeenCalledWith(currentCount);
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

			await expect(loadMoreExportedNotes(15)).rejects.toThrow("FORBIDDEN");

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockForbidden).toHaveBeenCalledOnce();
			expect(mockGetExportedNotes).not.toHaveBeenCalled();
		});

		test("should handle error and wrap it", async () => {
			const error = new Error("Database error");
			const wrappedError = { success: false, message: "error" };

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetExportedNotes.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreExportedNotes(15);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});

	describe("loadMoreUnexportedNotes", () => {
		test("should return success result when user has permission", async () => {
			const mockData = { data: [], totalCount: 18 };
			const currentCount = 8;

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetUnexportedNotes.mockResolvedValue(mockData);

			const result = await loadMoreUnexportedNotes(currentCount);

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockGetUnexportedNotes).toHaveBeenCalledWith(currentCount);
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

			await expect(loadMoreUnexportedNotes(8)).rejects.toThrow("FORBIDDEN");

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockForbidden).toHaveBeenCalledOnce();
			expect(mockGetUnexportedNotes).not.toHaveBeenCalled();
		});

		test("should handle error and wrap it", async () => {
			const error = new Error("Network error");
			const wrappedError = { success: false, message: "networkError" };

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetUnexportedNotes.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreUnexportedNotes(8);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});
});

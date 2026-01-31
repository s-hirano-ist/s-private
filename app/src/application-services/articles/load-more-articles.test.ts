import { forbidden } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { getExportedArticles, getUnexportedArticles } from "./get-articles";
import {
	loadMoreExportedArticles,
	loadMoreUnexportedArticles,
} from "./load-more-articles";

vi.mock("next/navigation");
vi.mock("@/common/auth/session");
vi.mock("@/common/error/error-wrapper");
vi.mock("./get-articles");

const mockHasViewerAdminPermission = vi.mocked(hasViewerAdminPermission);
const mockForbidden = vi.mocked(forbidden);
const mockWrapServerSideErrorForClient = vi.mocked(
	wrapServerSideErrorForClient,
);
const mockGetExportedArticles = vi.mocked(getExportedArticles);
const mockGetUnexportedArticles = vi.mocked(getUnexportedArticles);

describe("load-more-articles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("loadMoreExportedArticles", () => {
		test("should return success result when user has permission", async () => {
			const mockData = { data: [], totalCount: 10 };
			const currentCount = 5;

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetExportedArticles.mockResolvedValue(mockData);

			const result = await loadMoreExportedArticles(currentCount);

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockGetExportedArticles).toHaveBeenCalledWith(currentCount);
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

			await expect(loadMoreExportedArticles(5)).rejects.toThrow("FORBIDDEN");

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockForbidden).toHaveBeenCalledOnce();
			expect(mockGetExportedArticles).not.toHaveBeenCalled();
		});

		test("should handle error and wrap it", async () => {
			const error = new Error("Database error");
			const wrappedError = { success: false, message: "error" };

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetExportedArticles.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreExportedArticles(5);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});

	describe("loadMoreUnexportedArticles", () => {
		test("should return success result when user has permission", async () => {
			const mockData = { data: [], totalCount: 8 };
			const currentCount = 3;

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetUnexportedArticles.mockResolvedValue(mockData);

			const result = await loadMoreUnexportedArticles(currentCount);

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockGetUnexportedArticles).toHaveBeenCalledWith(currentCount);
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

			await expect(loadMoreUnexportedArticles(3)).rejects.toThrow("FORBIDDEN");

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockForbidden).toHaveBeenCalledOnce();
			expect(mockGetUnexportedArticles).not.toHaveBeenCalled();
		});

		test("should handle error and wrap it", async () => {
			const error = new Error("Network error");
			const wrappedError = { success: false, message: "networkError" };

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetUnexportedArticles.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreUnexportedArticles(3);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});
});

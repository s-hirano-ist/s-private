import { requireAuth } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getExportedArticles, getUnexportedArticles } from "./get-articles";
import {
	loadMoreExportedArticles,
	loadMoreUnexportedArticles,
} from "./load-more-articles";

vi.mock("@/common/auth/session");
vi.mock("@/common/error/error-wrapper");
vi.mock("./get-articles");

const mockRequireAuth = vi.mocked(requireAuth);
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
		test("should return success result when authenticated", async () => {
			const mockData = { data: [], totalCount: 10 };
			const currentCount = 5;

			mockRequireAuth.mockResolvedValue(undefined);
			mockGetExportedArticles.mockResolvedValue(mockData);

			const result = await loadMoreExportedArticles(currentCount);

			expect(mockRequireAuth).toHaveBeenCalledOnce();
			expect(mockGetExportedArticles).toHaveBeenCalledWith(currentCount);
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
			mockGetExportedArticles.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreExportedArticles(5);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});

	describe("loadMoreUnexportedArticles", () => {
		test("should return success result when authenticated", async () => {
			const mockData = { data: [], totalCount: 8 };
			const currentCount = 3;

			mockRequireAuth.mockResolvedValue(undefined);
			mockGetUnexportedArticles.mockResolvedValue(mockData);

			const result = await loadMoreUnexportedArticles(currentCount);

			expect(mockRequireAuth).toHaveBeenCalledOnce();
			expect(mockGetUnexportedArticles).toHaveBeenCalledWith(currentCount);
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
			mockGetUnexportedArticles.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreUnexportedArticles(3);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});
});

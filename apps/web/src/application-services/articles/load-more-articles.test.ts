import { requireAuth } from "@/common/auth/session";
import { backendActionError } from "@/common/backend/action-error";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { getExportedArticles, getUnexportedArticles } from "./get-articles";
import {
	loadMoreExportedArticles,
	loadMoreUnexportedArticles,
} from "./load-more-articles";

vi.mock("@/common/auth/session");
vi.mock("@/common/backend/action-error");
vi.mock("./get-articles");

const mockRequireAuth = vi.mocked(requireAuth);
const mockBackendActionError = vi.mocked(backendActionError);
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
			mockBackendActionError.mockReturnValue(wrappedError);

			const result = await loadMoreExportedArticles(5);

			expect(mockBackendActionError).toHaveBeenCalledWith(error);
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
			mockBackendActionError.mockReturnValue(wrappedError);

			const result = await loadMoreUnexportedArticles(3);

			expect(mockBackendActionError).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});
});

test.each([-1, 10001, 1.5, "5"])(
	"rejects invalid generated offset %s before data access",
	async (offset) => {
		vi.clearAllMocks();
		mockBackendActionError.mockReturnValue({
			success: false,
			message: "invalidFormat",
		});
		const result = await loadMoreExportedArticles(offset);
		expect(result).toEqual({ success: false, message: "invalidFormat" });
		expect(mockGetExportedArticles).not.toHaveBeenCalled();
		expect(mockBackendActionError).toHaveBeenCalledOnce();
	},
);

import { requireAuth } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getExportedImages, getUnexportedImages } from "./get-images";
import {
	loadMoreExportedImages,
	loadMoreUnexportedImages,
} from "./load-more-images";

vi.mock("@/common/auth/session");
vi.mock("@/common/error/error-wrapper");
vi.mock("./get-images");

const mockRequireAuth = vi.mocked(requireAuth);
const mockWrapServerSideErrorForClient = vi.mocked(
	wrapServerSideErrorForClient,
);
const mockGetExportedImages = vi.mocked(getExportedImages);
const mockGetUnexportedImages = vi.mocked(getUnexportedImages);

describe("load-more-images", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("loadMoreExportedImages", () => {
		test("should return success result when authenticated", async () => {
			const mockData = { data: [], totalCount: 15 };
			const currentCount = 10;

			mockRequireAuth.mockResolvedValue(undefined);
			mockGetExportedImages.mockResolvedValue(mockData);

			const result = await loadMoreExportedImages(currentCount);

			expect(mockRequireAuth).toHaveBeenCalledOnce();
			expect(mockGetExportedImages).toHaveBeenCalledWith(currentCount);
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
			mockGetExportedImages.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreExportedImages(10);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});

	describe("loadMoreUnexportedImages", () => {
		test("should return success result when authenticated", async () => {
			const mockData = { data: [], totalCount: 12 };
			const currentCount = 5;

			mockRequireAuth.mockResolvedValue(undefined);
			mockGetUnexportedImages.mockResolvedValue(mockData);

			const result = await loadMoreUnexportedImages(currentCount);

			expect(mockRequireAuth).toHaveBeenCalledOnce();
			expect(mockGetUnexportedImages).toHaveBeenCalledWith(currentCount);
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
			mockGetUnexportedImages.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreUnexportedImages(5);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});
});

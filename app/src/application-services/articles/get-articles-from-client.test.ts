import { forbidden } from "next/navigation";
import { makeStatus, makeUserId } from "s-core/common/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import { _getArticles } from "./get-articles";
import {
	loadMoreExportedArticles,
	loadMoreUnexportedArticles,
} from "./get-articles-from-client";

vi.mock("next/navigation");
vi.mock("@/common/auth/session");
vi.mock("@/common/error/error-wrapper");
vi.mock("@/common/utils/cache-utils");
vi.mock("s-core/common/entities/common-entity");
vi.mock("./get-articles");

const mockHasViewerAdminPermission = vi.mocked(hasViewerAdminPermission);
const mockGetSelfId = vi.mocked(getSelfId);
const mockForbidden = vi.mocked(forbidden);
const mockWrapServerSideErrorForClient = vi.mocked(
	wrapServerSideErrorForClient,
);
const mockSanitizeCacheTag = vi.mocked(sanitizeCacheTag);
const mockMakeStatus = vi.mocked(makeStatus);
const mock_getArticles = vi.mocked(_getArticles);

describe("get-articles-from-client", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("loadMoreExportedArticles", () => {
		test("should return success result when user has permission", async () => {
			const mockData = { data: [], totalCount: 10 };
			const currentCount = 5;
			const userId = makeUserId("test-user-id");

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetSelfId.mockResolvedValue(userId);
			mockMakeStatus.mockReturnValue("EXPORTED" as any);
			mockSanitizeCacheTag.mockReturnValue("test-user-id");
			mock_getArticles.mockResolvedValue(mockData);

			const result = await loadMoreExportedArticles(currentCount);

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockGetSelfId).toHaveBeenCalledOnce();
			expect(mockMakeStatus).toHaveBeenCalledWith("EXPORTED");
			expect(mockSanitizeCacheTag).toHaveBeenCalledWith(userId);
			expect(mock_getArticles).toHaveBeenCalledWith(
				currentCount,
				userId,
				"EXPORTED",
				{
					ttl: 400,
					swr: 40,
					tags: [`test-user-id_articles_${currentCount}`],
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

			await expect(loadMoreExportedArticles(5)).rejects.toThrow("FORBIDDEN");

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockForbidden).toHaveBeenCalledOnce();
			expect(mockGetSelfId).not.toHaveBeenCalled();
		});

		test("should handle error and wrap it", async () => {
			const error = new Error("Database error");
			const wrappedError = { success: false, message: "error" };

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetSelfId.mockResolvedValue(makeUserId("user-id"));
			mockMakeStatus.mockReturnValue("EXPORTED" as any);
			mockSanitizeCacheTag.mockReturnValue("user-id");
			mock_getArticles.mockRejectedValue(error);
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
			const userId = makeUserId("test-user-id-2");

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetSelfId.mockResolvedValue(userId);
			mockMakeStatus.mockReturnValue("UNEXPORTED" as any);
			mock_getArticles.mockResolvedValue(mockData);

			const result = await loadMoreUnexportedArticles(currentCount);

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockGetSelfId).toHaveBeenCalledOnce();
			expect(mockMakeStatus).toHaveBeenCalledWith("UNEXPORTED");
			expect(mock_getArticles).toHaveBeenCalledWith(
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

			await expect(loadMoreUnexportedArticles(3)).rejects.toThrow("FORBIDDEN");

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockForbidden).toHaveBeenCalledOnce();
			expect(mockGetSelfId).not.toHaveBeenCalled();
		});

		test("should handle error and wrap it", async () => {
			const error = new Error("Network error");
			const wrappedError = { success: false, message: "networkError" };

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetSelfId.mockResolvedValue(makeUserId("user-id-2"));
			mockMakeStatus.mockReturnValue("UNEXPORTED" as any);
			mock_getArticles.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreUnexportedArticles(3);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});
});

import { forbidden } from "next/navigation";
import { makeStatus, makeUserId } from "s-core/common/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import { _getNotes } from "./get-notes";
import {
	loadMoreExportedNotes,
	loadMoreUnexportedNotes,
} from "./get-notes-from-client";

vi.mock("next/navigation");
vi.mock("@/common/auth/session");
vi.mock("@/common/error/error-wrapper");
vi.mock("@/common/utils/cache-utils");
vi.mock("s-core/common/entities/common-entity");
vi.mock("./get-notes");

const mockHasViewerAdminPermission = vi.mocked(hasViewerAdminPermission);
const mockGetSelfId = vi.mocked(getSelfId);
const mockForbidden = vi.mocked(forbidden);
const mockWrapServerSideErrorForClient = vi.mocked(
	wrapServerSideErrorForClient,
);
const mockSanitizeCacheTag = vi.mocked(sanitizeCacheTag);
const mockMakeStatus = vi.mocked(makeStatus);
const mock_getNotes = vi.mocked(_getNotes);

describe("get-notes-from-client", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("loadMoreExportedNotes", () => {
		test("should return success result when user has permission", async () => {
			const mockData = { data: [], totalCount: 20 };
			const currentCount = 15;
			const userId = makeUserId("test-user-id");

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetSelfId.mockResolvedValue(userId);
			mockMakeStatus.mockReturnValue("EXPORTED" as any);
			mockSanitizeCacheTag.mockReturnValue("test-user-id");
			mock_getNotes.mockResolvedValue(mockData);

			const result = await loadMoreExportedNotes(currentCount);

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockGetSelfId).toHaveBeenCalledOnce();
			expect(mockMakeStatus).toHaveBeenCalledWith("EXPORTED");
			expect(mockSanitizeCacheTag).toHaveBeenCalledWith(userId);
			expect(mock_getNotes).toHaveBeenCalledWith(
				currentCount,
				userId,
				"EXPORTED",
				{
					ttl: 400,
					swr: 40,
					tags: [`test-user-id_notes_${currentCount}`],
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

			await expect(loadMoreExportedNotes(15)).rejects.toThrow("FORBIDDEN");

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
			mock_getNotes.mockRejectedValue(error);
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
			const userId = makeUserId("test-user-id-2");

			mockHasViewerAdminPermission.mockResolvedValue(true);
			mockGetSelfId.mockResolvedValue(userId);
			mockMakeStatus.mockReturnValue("UNEXPORTED" as any);
			mock_getNotes.mockResolvedValue(mockData);

			const result = await loadMoreUnexportedNotes(currentCount);

			expect(mockHasViewerAdminPermission).toHaveBeenCalledOnce();
			expect(mockGetSelfId).toHaveBeenCalledOnce();
			expect(mockMakeStatus).toHaveBeenCalledWith("UNEXPORTED");
			expect(mock_getNotes).toHaveBeenCalledWith(
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

			await expect(loadMoreUnexportedNotes(8)).rejects.toThrow("FORBIDDEN");

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
			mock_getNotes.mockRejectedValue(error);
			mockWrapServerSideErrorForClient.mockResolvedValue(wrappedError);

			const result = await loadMoreUnexportedNotes(8);

			expect(mockWrapServerSideErrorForClient).toHaveBeenCalledWith(error);
			expect(result).toEqual(wrappedError);
		});
	});
});

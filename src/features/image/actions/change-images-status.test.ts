import { SUCCESS_MESSAGES } from "@/constants";
import {
	getUserId,
	hasUpdateStatusPermissionOrThrow,
} from "@/features/auth/utils/get-session";
import prisma from "@/prisma";
import { sendLineNotifyMessage } from "@/utils/fetch-message";
import { formatChangeStatusMessage } from "@/utils/format-for-line";
import { revalidatePath } from "next/cache";
import { type Mock, describe, expect, it, vi } from "vitest";
import { changeImagesStatus } from "./change-images-status";

vi.mock("@/features/auth/utils/get-session", () => ({
	getUserId: vi.fn(),
	hasUpdateStatusPermissionOrThrow: vi.fn(),
}));

vi.mock("@/utils/fetch-message", () => ({
	sendLineNotifyMessage: vi.fn(),
}));

vi.mock("@/utils/format-for-line", () => ({
	formatChangeStatusMessage: vi.fn(),
}));

describe("changeImagesStatus", () => {
	it("should update the status of images and return success for UPDATE", async () => {
		// Mocking getUserId
		vi.mocked(getUserId).mockResolvedValue("test-user-id");

		// Mocking prisma $transaction behavior
		(prisma.$transaction as Mock).mockImplementation(async (callback) =>
			callback({
				images: {
					updateMany: vi
						.fn()
						.mockResolvedValueOnce({ count: 5 })
						.mockResolvedValueOnce({ count: 3 }),
				},
			}),
		);

		// Mocking formatChangeStatusMessage
		vi.mocked(formatChangeStatusMessage).mockReturnValue("Formatted message");

		const result = await changeImagesStatus("UPDATE");

		expect(hasUpdateStatusPermissionOrThrow).toHaveBeenCalled();
		expect(prisma.$transaction).toHaveBeenCalled();
		expect(formatChangeStatusMessage).toHaveBeenCalledWith(
			{ unexported: 0, recentlyUpdated: 3, exported: 5 },
			"IMAGES",
		);
		expect(sendLineNotifyMessage).toHaveBeenCalledWith("Formatted message");
		expect(revalidatePath).toHaveBeenCalledWith("/dumper");

		expect(result).toEqual({
			success: true,
			message: SUCCESS_MESSAGES.UPDATE,
			data: "Formatted message",
		});
	});

	it("should revert the status of images and return success for REVERT", async () => {
		// Mocking getUserId
		vi.mocked(getUserId).mockResolvedValue("test-user-id");

		// Mocking prisma $transaction behavior
		(prisma.$transaction as Mock).mockImplementation(async (callback) =>
			callback({
				images: {
					updateMany: vi
						.fn()
						.mockResolvedValueOnce({ count: 3 })
						.mockResolvedValueOnce({ count: 5 }),
				},
			}),
		);

		// Mocking formatChangeStatusMessage
		vi.mocked(formatChangeStatusMessage).mockReturnValue("Formatted message");

		const result = await changeImagesStatus("REVERT");

		expect(hasUpdateStatusPermissionOrThrow).toHaveBeenCalled();
		expect(prisma.$transaction).toHaveBeenCalled();
		expect(formatChangeStatusMessage).toHaveBeenCalledWith(
			{ unexported: 3, recentlyUpdated: 5, exported: 0 },
			"IMAGES",
		);
		expect(sendLineNotifyMessage).toHaveBeenCalledWith("Formatted message");
		expect(revalidatePath).toHaveBeenCalledWith("/dumper");

		expect(result).toEqual({
			success: true,
			message: SUCCESS_MESSAGES.UPDATE,
			data: "Formatted message",
		});
	});

	it("should handle errors and wrap them for client", async () => {
		const error = new Error("Test error");
		vi.mocked(hasUpdateStatusPermissionOrThrow).mockImplementation(() => {
			throw error;
		});

		const result = await changeImagesStatus("UPDATE");

		expect(result).toEqual({
			success: false,
			message: "予期せぬエラーが発生しました。",
		});
	});
});

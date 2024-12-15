import { SUCCESS_MESSAGES } from "@/constants";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import {
	getUserId,
	hasUpdateStatusPermissionOrThrow,
} from "@/features/auth/utils/get-session";
import prisma from "@/prisma";
import { sendLineNotifyMessage } from "@/utils/fetch-message";
import { formatChangeStatusMessage } from "@/utils/format-for-line";
import { revalidatePath } from "next/cache";
import { type Mock, describe, expect, it, vi } from "vitest";
import { changeNewsStatus } from "./change-news-status";

vi.mock("@/features/auth/utils/get-session", () => ({
	getUserId: vi.fn(),
	hasUpdateStatusPermissionOrThrow: vi.fn(),
}));

vi.mock("@/prisma", () => ({
	default: { $transaction: vi.fn() },
}));

vi.mock("@/utils/fetch-message", () => ({
	sendLineNotifyMessage: vi.fn(),
}));

vi.mock("@/utils/format-for-line", () => ({
	formatChangeStatusMessage: vi.fn(),
}));

vi.mock("@/error-wrapper", () => ({
	wrapServerSideErrorForClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

describe("changeNewsStatus", () => {
	it("should update news statuses and send notifications (UPDATE)", async () => {
		const mockUserId = "12345";
		const mockStatus = {
			unexported: 0,
			recentlyUpdated: 5,
			exported: 3,
		};
		const mockMessage = "Status updated successfully.";

		(hasUpdateStatusPermissionOrThrow as Mock).mockResolvedValue(undefined);
		(getUserId as Mock).mockResolvedValue(mockUserId);
		(prisma.$transaction as Mock).mockImplementation(async (callback) =>
			callback({
				news: {
					updateMany: vi
						.fn()
						.mockResolvedValueOnce({ count: 3 })
						.mockResolvedValueOnce({ count: 5 }),
				},
			}),
		);
		(formatChangeStatusMessage as Mock).mockReturnValue(mockMessage);

		const result = await changeNewsStatus("UPDATE");

		expect(hasUpdateStatusPermissionOrThrow).toHaveBeenCalledTimes(1);
		expect(getUserId).toHaveBeenCalledTimes(1);
		expect(prisma.$transaction).toHaveBeenCalled();
		expect(formatChangeStatusMessage).toHaveBeenCalledWith(mockStatus, "NEWS");
		expect(sendLineNotifyMessage).toHaveBeenCalledWith(mockMessage);
		expect(revalidatePath).toHaveBeenCalledWith("/dumper");
		expect(result).toEqual({
			success: true,
			message: SUCCESS_MESSAGES.UPDATE,
			data: mockMessage,
		});
	});

	it("should revert news statuses and send notifications (REVERT)", async () => {
		const mockUserId = "12345";
		const mockStatus = {
			unexported: 5,
			recentlyUpdated: 3,
			exported: 0,
		};
		const mockMessage = "Status reverted successfully.";

		(hasUpdateStatusPermissionOrThrow as Mock).mockResolvedValue(undefined);
		(getUserId as Mock).mockResolvedValue(mockUserId);
		(prisma.$transaction as Mock).mockImplementation(async (callback) =>
			callback({
				news: {
					updateMany: vi
						.fn()
						.mockResolvedValueOnce({ count: 5 })
						.mockResolvedValueOnce({ count: 3 }),
				},
			}),
		);
		(formatChangeStatusMessage as Mock).mockReturnValue(mockMessage);

		const result = await changeNewsStatus("REVERT");

		expect(hasUpdateStatusPermissionOrThrow).toHaveBeenCalledTimes(1);
		expect(getUserId).toHaveBeenCalledTimes(1);
		expect(prisma.$transaction).toHaveBeenCalled();
		expect(formatChangeStatusMessage).toHaveBeenCalledWith(mockStatus, "NEWS");
		expect(sendLineNotifyMessage).toHaveBeenCalledWith(mockMessage);
		expect(revalidatePath).toHaveBeenCalledWith("/dumper");
		expect(result).toEqual({
			success: true,
			message: SUCCESS_MESSAGES.UPDATE,
			data: mockMessage,
		});
	});

	it("should handle errors and wrap them for the client", async () => {
		const mockError = new Error("Unexpected error");

		(hasUpdateStatusPermissionOrThrow as Mock).mockResolvedValue(undefined);
		(getUserId as Mock).mockResolvedValue("12345");
		(prisma.$transaction as Mock).mockRejectedValue(mockError);
		(wrapServerSideErrorForClient as Mock).mockResolvedValue({
			success: false,
			message: "An error occurred",
			data: undefined,
		});

		const result = await changeNewsStatus("UPDATE");

		expect(hasUpdateStatusPermissionOrThrow).toHaveBeenCalledTimes(1);
		expect(getUserId).toHaveBeenCalledTimes(1);
		expect(prisma.$transaction).toHaveBeenCalled();
		expect(wrapServerSideErrorForClient).toHaveBeenCalledWith(mockError);
		expect(result).toEqual({
			success: false,
			message: "An error occurred",
			data: undefined,
		});
	});
});

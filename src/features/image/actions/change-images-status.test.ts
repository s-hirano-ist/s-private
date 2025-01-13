import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants";
import { auth } from "@/features/auth/utils/auth";
import prisma from "@/prisma";
import { sendLineNotifyMessage } from "@/utils/fetch-message";
import { Session } from "next-auth";
import { revalidatePath } from "next/cache";
import { type Mock, describe, expect, it, vi } from "vitest";
import { changeImagesStatus } from "./change-images-status";

vi.mock("@/features/auth/utils/auth", () => ({ auth: vi.fn() }));

vi.mock("@/utils/fetch-message", () => ({
	sendLineNotifyMessage: vi.fn(),
}));

const mockAllowedRoleSession: Session = {
	user: { id: "1", roles: ["dumper"] },
	expires: "2025-01-01",
};
const mockNotAllowedRoleSession: Session = {
	user: { id: "1", roles: [] },
	expires: "2025-01-01",
};
const mockUnauthorizedSession = null;

describe("changeImagesStatus", () => {
	it("should return success false on Unauthorized", async () => {
		(auth as Mock).mockResolvedValue(mockUnauthorizedSession);

		const result = await changeImagesStatus("UPDATE");

		expect(result).toEqual({
			success: false,
			message: ERROR_MESSAGES.UNAUTHORIZED,
		});
		expect(auth).toHaveBeenCalledTimes(1);
	});

	it("should return success false on not permitted", async () => {
		(auth as Mock).mockResolvedValue(mockNotAllowedRoleSession);

		const result = await changeImagesStatus("REVERT");

		expect(result).toEqual({
			success: false,
			message: ERROR_MESSAGES.NOT_ALLOWED,
		});
		expect(auth).toHaveBeenCalledTimes(1);
	});

	it("should update IMAGES statuses and send notifications (UPDATE)", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		(prisma.$transaction as Mock).mockImplementation(async (callback) =>
			callback({
				images: {
					updateMany: vi
						.fn()
						.mockResolvedValueOnce({ count: 3 }) // Exported
						.mockResolvedValueOnce({ count: 5 }), // Recently updated
				},
			}),
		);

		const result = await changeImagesStatus("UPDATE");

		expect(auth).toHaveBeenCalledTimes(2); // check permission & getSelfId
		expect(prisma.$transaction).toHaveBeenCalled();
		expect(sendLineNotifyMessage).toHaveBeenCalledWith(
			"【IMAGES】\n\n更新\n未処理: 0\n直近更新: 5\n確定: 3",
		);
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result).toEqual({
			success: true,
			message: SUCCESS_MESSAGES.UPDATE,
			data: "【IMAGES】\n\n更新\n未処理: 0\n直近更新: 5\n確定: 3",
		});
	});

	it("should revert IMAGES statuses and send notifications (REVERT)", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		(prisma.$transaction as Mock).mockImplementation(async (callback) =>
			callback({
				images: {
					updateMany: vi
						.fn()
						.mockResolvedValueOnce({ count: 5 }) // Unexported
						.mockResolvedValueOnce({ count: 3 }), // Recently updated
				},
			}),
		);

		const result = await changeImagesStatus("REVERT");

		expect(auth).toHaveBeenCalledTimes(2); // check permission & getSelfId
		expect(prisma.$transaction).toHaveBeenCalled();
		expect(sendLineNotifyMessage).toHaveBeenCalledWith(
			"【IMAGES】\n\n更新\n未処理: 5\n直近更新: 3\n確定: 0",
		);
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result).toEqual({
			success: true,
			message: SUCCESS_MESSAGES.UPDATE,
			data: "【IMAGES】\n\n更新\n未処理: 5\n直近更新: 3\n確定: 0",
		});
	});

	it("should handle unexpected errors gracefully", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		const mockError = new Error("Unexpected error");
		(prisma.$transaction as Mock).mockRejectedValue(mockError);

		const result = await changeImagesStatus("UPDATE");

		expect(prisma.$transaction).toHaveBeenCalled();
		expect(result).toEqual({
			success: false,
			message: ERROR_MESSAGES.UNEXPECTED,
		});
	});
});

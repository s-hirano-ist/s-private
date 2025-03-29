import { auth } from "@/features/auth/utils/auth";
import prisma from "@/prisma";
import { sendPushoverMessage } from "@/utils/fetch-message";
import { Session } from "next-auth";
import { revalidatePath } from "next/cache";
import { Mock, describe, expect, test, vi } from "vitest";
import { changeContentsStatus } from "./change-contents-status";

vi.mock("@/features/auth/utils/auth", () => ({ auth: vi.fn() }));

vi.mock("@/utils/fetch-message", () => ({
	sendPushoverMessage: vi.fn(),
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

describe("changeContentsStatus", () => {
	test("should return success false on Unauthorized", async () => {
		(auth as Mock).mockResolvedValue(mockUnauthorizedSession);

		const result = await changeContentsStatus("UPDATE");

		expect(result).toEqual({
			success: false,
			message: "unauthorized",
		});
		expect(auth).toHaveBeenCalledTimes(1);
	});

	test("should return success false on not permitted", async () => {
		(auth as Mock).mockResolvedValue(mockNotAllowedRoleSession);

		const result = await changeContentsStatus("REVERT");

		expect(result).toEqual({
			success: false,
			message: "notAllowed",
		});
		expect(auth).toHaveBeenCalledTimes(1);
	});

	test("should update contents statuses and send notifications (UPDATE)", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		(prisma.$transaction as Mock).mockImplementation(async (callback) =>
			callback({
				contents: {
					updateMany: vi
						.fn()
						.mockResolvedValueOnce({ count: 3 }) // Exported
						.mockResolvedValueOnce({ count: 5 }), // Recently updated
				},
			}),
		);

		const result = await changeContentsStatus("UPDATE");

		expect(auth).toHaveBeenCalledTimes(2); // check permission & getSelfId
		expect(prisma.$transaction).toHaveBeenCalled();
		expect(sendPushoverMessage).toHaveBeenCalledWith(
			"【CONTENTS】\n\n更新\n未処理: 0\n直近更新: 5\n確定: 3",
		);
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result).toEqual({
			success: true,
			message: "updated",
			data: "【CONTENTS】\n\n更新\n未処理: 0\n直近更新: 5\n確定: 3",
		});
	});

	test("should revert contents statuses and send notifications (REVERT)", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		(prisma.$transaction as Mock).mockImplementation(async (callback) =>
			callback({
				contents: {
					updateMany: vi
						.fn()
						.mockResolvedValueOnce({ count: 5 }) // Unexported
						.mockResolvedValueOnce({ count: 3 }), // Recently updated
				},
			}),
		);

		const result = await changeContentsStatus("REVERT");

		expect(auth).toHaveBeenCalledTimes(2); // check permission & getSelfId
		expect(prisma.$transaction).toHaveBeenCalled();
		expect(sendPushoverMessage).toHaveBeenCalledWith(
			"【CONTENTS】\n\n更新\n未処理: 5\n直近更新: 3\n確定: 0",
		);
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result).toEqual({
			success: true,
			message: "updated",
			data: "【CONTENTS】\n\n更新\n未処理: 5\n直近更新: 3\n確定: 0",
		});
	});

	test("should handle unexpected errors gracefully", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		const mockError = new Error("Unexpected error");
		(prisma.$transaction as Mock).mockRejectedValue(mockError);

		const result = await changeContentsStatus("UPDATE");

		expect(prisma.$transaction).toHaveBeenCalled();
		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});
});

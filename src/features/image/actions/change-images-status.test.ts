import { revalidatePath } from "next/cache";
import { Session } from "next-auth";
import { describe, expect, Mock, test, vi } from "vitest";
import { imageRepository } from "@/features/image/repositories/image-repository";
import prisma from "@/prisma";
import { auth } from "@/utils/auth/auth";
import { sendPushoverMessage } from "@/utils/notification/fetch-message";
import { changeImagesStatus } from "./change-images-status";

vi.mock("@/utils/auth/auth", () => ({ auth: vi.fn() }));

vi.mock("@/utils/notification/fetch-message", () => ({
	sendPushoverMessage: vi.fn(),
}));

vi.mock("@/features/image/repositories/image-repository", () => ({
	imageRepository: {
		updateManyStatus: vi.fn(),
	},
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
	test("should return success false on Unauthorized", async () => {
		(auth as Mock).mockResolvedValue(mockUnauthorizedSession);

		await expect(changeImagesStatus("UPDATE")).rejects.toThrow("UNAUTHORIZED");
	});

	test("should return success false on not permitted", async () => {
		(auth as Mock).mockResolvedValue(mockNotAllowedRoleSession);

		await expect(changeImagesStatus("REVERT")).rejects.toThrow("FORBIDDEN");
	});

	test("should update IMAGES statuses and send notifications (UPDATE)", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		(prisma.$transaction as Mock).mockImplementation(async (callback) => {
			const result = await callback();
			return result;
		});
		vi.mocked(imageRepository.updateManyStatus)
			.mockResolvedValueOnce(3) // Exported
			.mockResolvedValueOnce(5); // Recently updated

		const result = await changeImagesStatus("UPDATE");

		expect(auth).toHaveBeenCalledTimes(2); // check permission & getSelfId
		expect(prisma.$transaction).toHaveBeenCalled();
		expect(sendPushoverMessage).toHaveBeenCalledWith(
			"【IMAGES】\n\n更新\n未処理: 0\n直近更新: 5\n確定: 3",
		);
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result).toEqual({
			success: true,
			message: "updated",
			data: "【IMAGES】\n\n更新\n未処理: 0\n直近更新: 5\n確定: 3",
		});
	});

	test("should revert IMAGES statuses and send notifications (REVERT)", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		(prisma.$transaction as Mock).mockImplementation(async (callback) => {
			const result = await callback();
			return result;
		});
		vi.mocked(imageRepository.updateManyStatus)
			.mockResolvedValueOnce(5) // Unexported
			.mockResolvedValueOnce(3); // Recently updated

		const result = await changeImagesStatus("REVERT");

		expect(auth).toHaveBeenCalledTimes(2); // check permission & getSelfId
		expect(prisma.$transaction).toHaveBeenCalled();
		expect(sendPushoverMessage).toHaveBeenCalledWith(
			"【IMAGES】\n\n更新\n未処理: 5\n直近更新: 3\n確定: 0",
		);
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result).toEqual({
			success: true,
			message: "updated",
			data: "【IMAGES】\n\n更新\n未処理: 5\n直近更新: 3\n確定: 0",
		});
	});

	test("should handle unexpected errors gracefully", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		const mockError = new Error("Unexpected error");
		(prisma.$transaction as Mock).mockRejectedValue(mockError);

		const result = await changeImagesStatus("UPDATE");

		expect(prisma.$transaction).toHaveBeenCalled();
		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});
});

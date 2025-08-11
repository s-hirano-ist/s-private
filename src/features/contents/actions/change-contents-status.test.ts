import { revalidatePath } from "next/cache";
import { Session } from "next-auth";
import { describe, expect, Mock, test, vi } from "vitest";
import { contentsRepository } from "@/features/contents/repositories/contents-repository";
import { auth } from "@/utils/auth/auth";
import { sendPushoverMessage } from "@/utils/notification/fetch-message";
import { changeContentsStatus } from "./change-contents-status";

vi.mock("@/utils/notification/fetch-message", () => ({
	sendPushoverMessage: vi.fn(),
}));

vi.mock("@/features/contents/repositories/contents-repository", () => ({
	contentsRepository: {
		updateManyStatus: vi.fn(),
		transaction: vi.fn(),
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

describe("changeContentsStatus", () => {
	test("should return success false on Unauthorized", async () => {
		(auth as Mock).mockResolvedValue(mockUnauthorizedSession);

		await expect(changeContentsStatus("UPDATE")).rejects.toThrow(
			"UNAUTHORIZED",
		);
	});

	test("should return success false on not permitted", async () => {
		(auth as Mock).mockResolvedValue(mockNotAllowedRoleSession);

		await expect(changeContentsStatus("REVERT")).rejects.toThrow("FORBIDDEN");
	});

	test("should update contents statuses and send notifications (UPDATE)", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		vi.mocked(contentsRepository.transaction).mockImplementation(
			async (callback) => {
				const result = await callback();
				return result;
			},
		);
		vi.mocked(contentsRepository.updateManyStatus)
			.mockResolvedValueOnce(3) // Exported
			.mockResolvedValueOnce(5); // Recently updated

		const result = await changeContentsStatus("UPDATE");

		expect(auth).toHaveBeenCalledTimes(2); // check permission & getSelfId
		expect(contentsRepository.transaction).toHaveBeenCalled();
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
		vi.mocked(contentsRepository.transaction).mockImplementation(
			async (callback) => {
				const result = await callback();
				return result;
			},
		);
		vi.mocked(contentsRepository.updateManyStatus)
			.mockResolvedValueOnce(5) // Unexported
			.mockResolvedValueOnce(3); // Recently updated

		const result = await changeContentsStatus("REVERT");

		expect(auth).toHaveBeenCalledTimes(2); // check permission & getSelfId
		expect(contentsRepository.transaction).toHaveBeenCalled();
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
		vi.mocked(contentsRepository.transaction).mockRejectedValue(mockError);

		const result = await changeContentsStatus("UPDATE");

		expect(contentsRepository.transaction).toHaveBeenCalled();
		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});
});

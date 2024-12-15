import { SUCCESS_MESSAGES } from "@/constants";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { signIn as NextAuthSignIn } from "@/features/auth/utils/auth";
import { getLoginUserInfo } from "@/features/auth/utils/header-info";
import prisma from "@/prisma";
import { sendLineNotifyMessage } from "@/utils/fetch-message";
import { type Mock, describe, expect, it, vi } from "vitest";
import { signIn } from "./sign-in";

vi.mock("@/features/auth/utils/auth", () => ({
	signIn: vi.fn(),
}));

vi.mock("@/features/auth/utils/header-info", () => ({
	getLoginUserInfo: vi.fn(),
}));

vi.mock("@/utils/fetch-message", () => ({
	sendLineNotifyMessage: vi.fn(),
}));

vi.mock("@/error-wrapper", () => ({
	wrapServerSideErrorForClient: vi.fn(),
}));

describe("signIn", () => {
	it("should sign in the user, log login history, and send notifications", async () => {
		const mockSignInValues = {
			username: "testuser",
			password: "password123",
		};
		const mockUser = { id: "12345" };
		const mockLoginInfo = {
			ipAddress: "192.168.1.1",
			userAgent: "Mozilla/5.0",
		};

		(NextAuthSignIn as Mock).mockResolvedValue(undefined);
		(getLoginUserInfo as Mock).mockReturnValue(mockLoginInfo);
		(prisma.users.findUniqueOrThrow as Mock).mockResolvedValue(mockUser);
		(prisma.loginHistories.create as Mock).mockResolvedValue(undefined);

		const result = await signIn(mockSignInValues);

		expect(NextAuthSignIn).toHaveBeenCalledWith("credentials", {
			...mockSignInValues,
			redirect: false,
		});
		expect(getLoginUserInfo).toHaveBeenCalledTimes(1);
		expect(prisma.users.findUniqueOrThrow).toHaveBeenCalledWith({
			where: { username: mockSignInValues.username },
			select: { id: true },
		});
		expect(prisma.loginHistories.create).toHaveBeenCalledWith({
			data: {
				userId: mockUser.id,
				ipAddress: mockLoginInfo.ipAddress,
				userAgent: mockLoginInfo.userAgent,
			},
		});
		expect(sendLineNotifyMessage).toHaveBeenCalledWith(
			SUCCESS_MESSAGES.SIGN_IN,
		);
		expect(result).toEqual({
			success: true,
			message: SUCCESS_MESSAGES.SIGN_IN,
			data: undefined,
		});
	});

	it("should handle errors and wrap them for the client", async () => {
		const mockSignInValues = {
			username: "testuser",
			password: "password123",
		};
		const mockError = new Error("Sign-in failed");

		(NextAuthSignIn as Mock).mockRejectedValue(mockError);
		(wrapServerSideErrorForClient as Mock).mockResolvedValue({
			success: false,
			message: "An error occurred",
			data: undefined,
		});

		const result = await signIn(mockSignInValues);

		expect(NextAuthSignIn).toHaveBeenCalledWith("credentials", {
			...mockSignInValues,
			redirect: false,
		});
		expect(wrapServerSideErrorForClient).toHaveBeenCalledWith(mockError);
		expect(result).toEqual({
			success: false,
			message: "An error occurred",
			data: undefined,
		});
	});
});

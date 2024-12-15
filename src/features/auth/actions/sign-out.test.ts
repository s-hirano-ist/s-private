import { SUCCESS_MESSAGES } from "@/constants";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { signOut as NextAuthSignOut } from "@/features/auth/utils/auth";
import { sendLineNotifyMessage } from "@/utils/fetch-message";
import { type Mock, describe, expect, it, vi } from "vitest";
import { signOut } from "./sign-out";

vi.mock("@/features/auth/utils/auth", () => ({
	signOut: vi.fn(),
}));

vi.mock("@/utils/fetch-message", () => ({
	sendLineNotifyMessage: vi.fn(),
}));

vi.mock("@/error-wrapper", () => ({
	wrapServerSideErrorForClient: vi.fn(),
}));

describe("signOut", () => {
	it("should sign out the user and send notifications", async () => {
		(NextAuthSignOut as Mock).mockResolvedValue(undefined);

		const result = await signOut();

		expect(NextAuthSignOut).toHaveBeenCalledWith({
			redirect: false,
		});
		expect(sendLineNotifyMessage).toHaveBeenCalledWith(
			SUCCESS_MESSAGES.SIGN_OUT,
		);
		expect(result).toEqual({
			success: true,
			message: SUCCESS_MESSAGES.SIGN_OUT,
			data: undefined,
		});
	});

	it("should handle errors and wrap them for the client", async () => {
		const mockError = new Error("Sign-out failed");

		(NextAuthSignOut as Mock).mockRejectedValue(mockError);
		(wrapServerSideErrorForClient as Mock).mockResolvedValue({
			success: false,
			message: "An error occurred",
			data: undefined,
		});

		const result = await signOut();

		expect(NextAuthSignOut).toHaveBeenCalledWith({
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

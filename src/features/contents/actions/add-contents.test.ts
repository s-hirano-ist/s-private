import { SUCCESS_MESSAGES } from "@/constants";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import {
	getUserId,
	hasDumperPostPermissionOrThrow,
} from "@/features/auth/utils/get-session";
import { validateContents } from "@/features/contents/utils/validate-contents";
import prisma from "@/prisma";
import { sendLineNotifyMessage } from "@/utils/fetch-message";
import { formatCreateContentsMessage } from "@/utils/format-for-line";
import { revalidatePath } from "next/cache";
import { type Mock, describe, expect, it, vi } from "vitest";
import { addContents } from "./add-contents";

vi.mock("@/features/auth/utils/get-session", () => ({
	getUserId: vi.fn(),
	hasSelfPostPermissionOrThrow: vi.fn(),
}));

vi.mock("@/features/contents/utils/validate-contents", () => ({
	validateContents: vi.fn(),
}));

vi.mock("@/utils/fetch-message", () => ({
	sendLineNotifyMessage: vi.fn(),
}));

vi.mock("@/utils/format-for-line", () => ({
	formatCreateContentsMessage: vi.fn(),
}));

vi.mock("@/error-wrapper", () => ({
	wrapServerSideErrorForClient: vi.fn(),
}));

describe("addContents", () => {
	it("should create contents and send notifications", async () => {
		const formData = new FormData();
		formData.append("title", "Example Content");
		formData.append("quote", "This is an example content quote.");
		formData.append("url", "https://example.com/content");

		const mockUserId = "12345";
		const mockValidatedContents = {
			title: "Example Content",
			quote: "This is an example content quote.",
			url: "https://example.com/content",
		};
		const mockCreatedContents = {
			id: 1,
			title: "Example Content",
			quote: "This is an example content quote.",
			url: "https://example.com/content",
		};
		const mockMessage = "Content created successfully.";

		(hasDumperPostPermissionOrThrow as Mock).mockResolvedValue(undefined);
		(getUserId as Mock).mockResolvedValue(mockUserId);
		(validateContents as Mock).mockReturnValue(mockValidatedContents);
		(prisma.contents.create as Mock).mockResolvedValue(mockCreatedContents);
		(formatCreateContentsMessage as Mock).mockReturnValue(mockMessage);

		const result = await addContents(formData);

		expect(hasDumperPostPermissionOrThrow).toHaveBeenCalledTimes(1);
		expect(getUserId).toHaveBeenCalledTimes(1);
		expect(validateContents).toHaveBeenCalledWith(formData);
		expect(prisma.contents.create).toHaveBeenCalledWith({
			data: { userId: mockUserId, ...mockValidatedContents },
			select: {
				id: true,
				title: true,
				quote: true,
				url: true,
			},
		});
		expect(formatCreateContentsMessage).toHaveBeenCalledWith(
			mockCreatedContents,
		);
		expect(sendLineNotifyMessage).toHaveBeenCalledWith(mockMessage);
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result).toEqual({
			success: true,
			message: SUCCESS_MESSAGES.INSERTED,
			data: mockCreatedContents,
		});
	});

	it("should handle errors and wrap them for the client", async () => {
		const formData = new FormData();
		formData.append("title", "Example Content");
		formData.append("quote", "This is an example content quote.");
		formData.append("url", "https://example.com/content");

		const mockError = new Error("Database error");

		(hasDumperPostPermissionOrThrow as Mock).mockResolvedValue(undefined);
		(getUserId as Mock).mockResolvedValue("12345");
		(prisma.contents.create as Mock).mockRejectedValue(mockError);
		(wrapServerSideErrorForClient as Mock).mockResolvedValue({
			success: false,
			message: "An error occurred",
			data: undefined,
		});

		const result = await addContents(formData);

		expect(hasDumperPostPermissionOrThrow).toHaveBeenCalledTimes(1);
		expect(getUserId).toHaveBeenCalledTimes(1);
		expect(validateContents).toHaveBeenCalledWith(formData);
		expect(prisma.contents.create).toHaveBeenCalled();
		expect(wrapServerSideErrorForClient).toHaveBeenCalledWith(mockError);
		expect(result).toEqual({
			success: false,
			message: "An error occurred",
			data: undefined,
		});
	});
});

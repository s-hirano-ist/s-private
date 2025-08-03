import { revalidatePath } from "next/cache";
import { Session } from "next-auth";
import { describe, expect, Mock, test, vi } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/utils/auth/auth";
import { addContents } from "./add-contents";

vi.mock("@/utils/auth/auth", () => ({ auth: vi.fn() }));

vi.mock("@/utils/notification/fetch-message", () => ({
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

const mockFormData = new FormData();
mockFormData.append("title", "Example Content");
mockFormData.append("quote", "This is an example content quote.");
mockFormData.append("url", "https://example.com");
const mockCreatedContents = {
	id: 1,
	title: "Example Content",
	quote: "This is an example content quote.",
	url: "https://example.com",
};

describe("addContents", () => {
	test("should return success false on Unauthorized", async () => {
		(auth as Mock).mockResolvedValue(mockUnauthorizedSession);

		await expect(addContents(mockFormData)).rejects.toThrow("UNAUTHORIZED");
	});

	test("should return success false on not permitted", async () => {
		(auth as Mock).mockResolvedValue(mockNotAllowedRoleSession);

		await expect(addContents(mockFormData)).rejects.toThrow("FORBIDDEN");
	});

	test("should create contents", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		(prisma.contents.create as Mock).mockResolvedValue(mockCreatedContents);

		const result = await addContents(mockFormData);

		expect(auth).toHaveBeenCalledTimes(2); // check permission & getSelfId
		expect(prisma.contents.create).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result).toEqual({
			success: true,
			message: "inserted",
			data: mockCreatedContents,
		});
	});
});

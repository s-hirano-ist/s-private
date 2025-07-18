import { revalidatePath } from "next/cache";
import { Session } from "next-auth";
import { describe, expect, Mock, test, vi } from "vitest";
import { auth } from "@/features/auth/utils/auth";
import prisma from "@/prisma";
import { addContents } from "./add-contents";

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

		const result = await addContents(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "unauthorized",
		});
		expect(auth).toHaveBeenCalledTimes(1);
	});

	test("should return success false on not permitted", async () => {
		(auth as Mock).mockResolvedValue(mockNotAllowedRoleSession);

		const result = await addContents(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "notAllowed",
		});
		expect(auth).toHaveBeenCalledTimes(1);
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

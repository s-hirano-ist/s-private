import { revalidatePath } from "next/cache";
import { Session } from "next-auth";
import { describe, expect, Mock, test, vi } from "vitest";
import { contentsRepository } from "@/features/contents/repositories/contents-repository";
import { auth } from "@/utils/auth/auth";
import { addContents } from "./add-contents";

vi.mock("@/utils/notification/fetch-message", () => ({
	sendPushoverMessage: vi.fn(),
}));

vi.mock("@/features/contents/repositories/contents-repository", () => ({
	contentsRepository: {
		create: vi.fn(),
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
		vi.mocked(contentsRepository.create).mockResolvedValue({
			id: 1,
			title: "Example Content",
			quote: "This is an example content quote.",
			url: "https://example.com",
			userId: "1",
			status: "UNEXPORTED",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const result = await addContents(mockFormData);

		expect(auth).toHaveBeenCalledTimes(2); // check permission & getSelfId
		expect(contentsRepository.create).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result).toEqual({
			success: true,
			message: "inserted",
			data: mockCreatedContents,
		});
	});
});

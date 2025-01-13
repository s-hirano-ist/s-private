import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants";
import { auth } from "@/features/auth/utils/auth";
import prisma from "@/prisma";
import { Session } from "next-auth";
import { revalidatePath } from "next/cache";
import { type Mock, describe, expect, it, vi } from "vitest";
import { addNews } from "./add-news";

vi.mock("@/features/auth/utils/auth", () => ({ auth: vi.fn() }));

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
mockFormData.append("category", "tech");

const mockCreatedNews = {
	id: 1,
	title: "Example Content",
	quote: "This is an example news quote.",
	url: "https://example.com",
	Category: { name: "tech" },
};

describe("addNews", () => {
	it("should return success false on Unauthorized", async () => {
		(auth as Mock).mockResolvedValue(mockUnauthorizedSession);

		const result = await addNews(mockFormData);

		expect(result).toEqual({
			success: false,
			message: ERROR_MESSAGES.UNAUTHORIZED,
		});
		expect(auth).toHaveBeenCalledTimes(1);
	});

	it("should return success false on not permitted", async () => {
		(auth as Mock).mockResolvedValue(mockNotAllowedRoleSession);

		const result = await addNews(mockFormData);

		expect(result).toEqual({
			success: false,
			message: ERROR_MESSAGES.NOT_ALLOWED,
		});
		expect(auth).toHaveBeenCalledTimes(1);
	});

	it("should create only news if no new category is provided", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		(prisma.categories.upsert as Mock).mockResolvedValue({
			id: 1,
			name: "tech",
		});
		(prisma.news.create as Mock).mockResolvedValue(mockCreatedNews);

		const result = await addNews(mockFormData);

		expect(auth).toHaveBeenCalledTimes(2); // check permission & getSelfId
		expect(prisma.news.create).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result).toEqual({
			success: true,
			message: SUCCESS_MESSAGES.INSERTED,
			data: {
				...mockCreatedNews,
				category: mockCreatedNews.Category.name,
			},
		});
	});
});

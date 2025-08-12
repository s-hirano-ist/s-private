import { revalidatePath } from "next/cache";
import { Session } from "next-auth";
import { describe, expect, Mock, test, vi } from "vitest";
import { categoryRepository } from "@/features/news/repositories/category-repository";
import { newsRepository } from "@/features/news/repositories/news-repository";
import { auth } from "@/utils/auth/auth";
import { addNews } from "./add-news";

vi.mock("@/utils/notification/fetch-message", () => ({
	sendPushoverMessage: vi.fn(),
}));

vi.mock("@/features/news/repositories/category-repository", () => ({
	categoryRepository: {
		upsert: vi.fn(),
	},
}));

vi.mock("@/features/news/repositories/news-repository", () => ({
	newsRepository: {
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
mockFormData.append("quote", "This is an example news quote.");
mockFormData.append("url", "https://example.com");
mockFormData.append("category", "tech");

describe("addNews", () => {
	test("should return success false on Unauthorized", async () => {
		(auth as Mock).mockResolvedValue(mockUnauthorizedSession);

		await expect(addNews(mockFormData)).rejects.toThrow("UNAUTHORIZED");
	});

	test("should return success false on not permitted", async () => {
		(auth as Mock).mockResolvedValue(mockNotAllowedRoleSession);

		await expect(addNews(mockFormData)).rejects.toThrow("FORBIDDEN");
	});

	test("should create only news if no new category is provided", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		vi.mocked(categoryRepository.upsert).mockResolvedValue({
			id: 1,
			name: "tech",
			createdAt: new Date(),
			updatedAt: new Date(),
			userId: "1",
		});
		vi.mocked(newsRepository.create).mockResolvedValue({
			id: 1,
			title: "Example Content",
			quote: "This is an example news quote.",
			url: "https://example.com",
			categoryId: 1,
			userId: "1",
			status: "UNEXPORTED",
			createdAt: new Date(),
			updatedAt: new Date(),
			Category: { id: 1, name: "tech" },
			ogTitle: "sample og title 1",
			ogDescription: "sample og description 1",
			ogImageUrl: "https://example.com/1",
		});

		const result = await addNews(mockFormData);

		expect(auth).toHaveBeenCalledTimes(2); // check permission & getSelfId
		expect(categoryRepository.upsert).toHaveBeenCalled();
		expect(newsRepository.create).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result.success).toBe(true);
		expect(result.message).toBe("inserted");
	});
});

import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { categoryCommandRepository } from "@/features/news/repositories/category-command-repository";
import { newsCommandRepository } from "@/features/news/repositories/news-command-repository";
import { addNews } from "./add-news";

vi.mock("@/features/news/repositories/category-command-repository", () => ({
	categoryCommandRepository: {
		upsert: vi.fn(),
	},
}));

vi.mock("@/features/news/repositories/news-command-repository", () => ({
	newsCommandRepository: {
		create: vi.fn(),
	},
}));

const mockGetSelfId = vi.fn();
const mockHasDumperPostPermission = vi.fn();

vi.mock("@/utils/auth/session", () => ({
	getSelfId: () => mockGetSelfId(),
	hasDumperPostPermission: () => mockHasDumperPostPermission(),
}));

const mockFormData = new FormData();
mockFormData.append("title", "Example Content");
mockFormData.append("quote", "This is an example news quote.");
mockFormData.append("url", "https://example.com");
mockFormData.append("category", "tech");

describe("addNews", () => {
	test("should return success false on Unauthorized", async () => {
		mockGetSelfId.mockRejectedValue(new Error("UNAUTHORIZED"));
		mockHasDumperPostPermission.mockResolvedValue(true);

		const result = await addNews(mockFormData);
		expect(result.success).toBe(false);
	});

	test("should return success false on not permitted", async () => {
		mockHasDumperPostPermission.mockResolvedValue(false);

		await expect(addNews(mockFormData)).rejects.toThrow("FORBIDDEN");
	});

	test("should create only news if no new category is provided", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("1");
		vi.mocked(categoryCommandRepository.upsert).mockResolvedValue({
			id: 1,
			name: "tech",
			createdAt: new Date(),
			updatedAt: new Date(),
			userId: "1",
		});
		vi.mocked(newsCommandRepository.create).mockResolvedValue({
			id: "1",
			title: "Example Content",
			quote: "This is an example news quote.",
			url: "https://example.com",
			Category: { name: "tech" },
			ogTitle: "sample og title 1",
			ogDescription: "sample og description 1",
		});

		const result = await addNews(mockFormData);

		expect(mockHasDumperPostPermission).toHaveBeenCalled();
		expect(mockGetSelfId).toHaveBeenCalled();
		expect(categoryCommandRepository.upsert).toHaveBeenCalled();
		expect(newsCommandRepository.create).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result.success).toBe(true);
		expect(result.message).toBe("inserted");
	});
});

import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { newsCommandRepository } from "@/features/news/repositories/news-command-repository";
import { addNews } from "./add-news";

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

	test("should create news with category", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("1");
		vi.mocked(newsCommandRepository.create).mockResolvedValue();

		const result = await addNews(mockFormData);

		expect(mockHasDumperPostPermission).toHaveBeenCalled();
		expect(mockGetSelfId).toHaveBeenCalled();
		expect(newsCommandRepository.create).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result.success).toBe(true);
		expect(result.message).toBe("inserted");
	});
});

import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { DuplicateError } from "@/common/error/error-classes";
import { newsCommandRepository } from "@/infrastructures/news/repositories/news-command-repository";
import { addNews } from "./add-news";

vi.mock("@/infrastructures/news/repositories/news-command-repository", () => ({
	newsCommandRepository: {
		create: vi.fn(),
	},
}));

const mockGetSelfId = vi.fn();
const mockHasDumperPostPermission = vi.fn();

vi.mock("@/common/auth/session", () => ({
	getSelfId: () => mockGetSelfId(),
	hasDumperPostPermission: () => mockHasDumperPostPermission(),
}));

const mockPrepareNewNews = vi.fn();
vi.mock("@/domains/news/services/news-domain-service", () => ({
	NewsDomainService: vi.fn().mockImplementation(() => ({
		prepareNewNews: mockPrepareNewNews,
	})),
}));

vi.mock("@/infrastructures/news/repositories/news-query-repository", () => ({
	newsQueryRepository: {},
}));

const mockFormData = new FormData();
mockFormData.append("title", "Example Content");
mockFormData.append("quote", "This is an example news quote.");
mockFormData.append("url", "https://example.com");
mockFormData.append("category", "tech");
mockFormData.append("id", "test-id");

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
		mockGetSelfId.mockResolvedValue("user-123");
		mockPrepareNewNews.mockResolvedValue({
			category: {
				name: "tech",
				userId: "user-123",
				id: "01234567-89ab-cdef-0123-456789abcdef",
			},
			title: "Example Content",
			quote: "This is an example news quote.",
			url: "https://example.com",
			userId: "user-123",
			status: "UNEXPORTED",
			id: "01234567-89ab-cdef-0123-456789abcdef",
		});
		vi.mocked(newsCommandRepository.create).mockResolvedValue();

		const result = await addNews(mockFormData);

		expect(mockHasDumperPostPermission).toHaveBeenCalled();
		expect(mockGetSelfId).toHaveBeenCalled();
		expect(mockPrepareNewNews).toHaveBeenCalledWith(mockFormData, "user-123");
		expect(newsCommandRepository.create).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result.success).toBe(true);
		expect(result.message).toBe("inserted");
	});

	test("should preserve form data on DuplicateError", async () => {
		mockHasDumperPostPermission.mockResolvedValue(true);
		mockGetSelfId.mockResolvedValue("user-123");
		mockPrepareNewNews.mockRejectedValue(new DuplicateError());

		const result = await addNews(mockFormData);

		expect(result.success).toBe(false);
		expect(result.message).toBe("duplicated");
		expect(result.formData).toEqual({
			title: "Example Content",
			quote: "This is an example news quote.",
			url: "https://example.com",
			category: "tech",
			id: "test-id",
		});
	});
});

import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { DuplicateError } from "@/common/error/error-classes";
import { newsCommandRepository } from "@/infrastructures/news/repositories/news-command-repository";
import { addNews } from "./add-news";

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	hasDumperPostPermission: vi.fn(),
}));

vi.mock("@/infrastructures/news/repositories/news-command-repository", () => ({
	newsCommandRepository: { create: vi.fn() },
}));

vi.mock("@/infrastructures/news/repositories/news-query-repository", () => ({
	newsQueryRepository: {},
}));

const mockPrepareNewNews = vi.fn();

vi.mock("@/domains/news/services/news-domain-service", () => ({
	NewsDomainService: vi.fn().mockImplementation(() => ({
		prepareNewNews: mockPrepareNewNews,
	})),
}));

const mockFormData = new FormData();
mockFormData.append("title", "Example Content");
mockFormData.append("quote", "This is an example news quote.");
mockFormData.append("url", "https://example.com");
mockFormData.append("category", "tech");

describe("addNews", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should return success false on Unauthorized", async () => {
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);

		const result = await addNews(mockFormData);
		expect(result.success).toBe(false);
	});

	test("should return forbidden when user doesn't have permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		await expect(addNews(mockFormData)).rejects.toThrow("FORBIDDEN");
	});

	test("should create news with category", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");
		mockPrepareNewNews.mockResolvedValue({
			category: {
				name: "tech",
				userId: "user-123",
				id: "01234567-89ab-4def-9123-456789abcdef",
			},
			title: "Example Content",
			quote: "This is an example news quote.",
			url: "https://example.com",
			userId: "user-123",
			status: "UNEXPORTED",
			id: "01234567-89ab-4def-9123-456789abcdef",
		});
		vi.mocked(newsCommandRepository.create).mockResolvedValue();

		const result = await addNews(mockFormData);

		expect(vi.mocked(hasDumperPostPermission)).toHaveBeenCalled();
		expect(mockPrepareNewNews).toHaveBeenCalledWith(mockFormData, "user-123");
		expect(newsCommandRepository.create).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result.success).toBe(true);
		expect(result.message).toBe("inserted");
	});

	test("should preserve form data on DuplicateError", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");
		mockPrepareNewNews.mockRejectedValue(new DuplicateError());

		const result = await addNews(mockFormData);

		expect(result.success).toBe(false);
		expect(result.message).toBe("duplicated");
		expect(result.formData).toEqual({
			title: "Example Content",
			quote: "This is an example news quote.",
			url: "https://example.com",
			category: "tech",
		});
	});

	test("should handle errors and return wrapped error", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");

		const error = new Error("Domain service error");
		mockPrepareNewNews.mockRejectedValue(error);

		const result = await addNews(mockFormData);

		expect(result).toEqual({ success: false, message: "unexpected" });
	});
});

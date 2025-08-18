import { revalidateTag } from "next/cache";
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
});

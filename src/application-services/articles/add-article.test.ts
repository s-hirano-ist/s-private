import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { addArticle } from "./add-article";

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	hasDumperPostPermission: vi.fn(),
}));

vi.mock(
	"@/infrastructures/articles/repositories/articles-command-repository",
	() => ({
		articlesCommandRepository: { create: vi.fn() },
	}),
);

vi.mock(
	"@/infrastructures/articles/repositories/articles-query-repository",
	() => ({
		articlesQueryRepository: {},
	}),
);

const mockPrepareNewArticle = vi.fn();

vi.mock("@/domains/articles/services/articles-domain-service", () => ({
	ArticlesDomainService: vi.fn().mockImplementation(() => ({
		prepareNewArticle: mockPrepareNewArticle,
	})),
}));

const mockFormData = new FormData();
mockFormData.append("title", "Example Content");
mockFormData.append("quote", "This is an example article quote.");
mockFormData.append("url", "https://example.com");
mockFormData.append("category", "tech");

describe("addArticle", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should return success false on Unauthorized", async () => {
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);

		const result = await addArticle(mockFormData);
		expect(result.success).toBe(false);
	});

	test("should return forbidden when user doesn't have permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		await expect(addArticle(mockFormData)).rejects.toThrow("FORBIDDEN");
	});
});

import { revalidateTag } from "next/cache";
import {
	articleEntity,
	makeArticleTitle,
	makeCategoryName,
	makeQuote,
	makeUrl,
} from "s-private-domains/articles/entities/article-entity";
import {
	makeCreatedAt,
	makeId,
	makeUnexportedStatus,
	makeUserId,
} from "s-private-domains/common/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { DuplicateError } from "@/common/error/error-classes";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import { articlesCommandRepository } from "@/infrastructures/articles/repositories/articles-command-repository";
import { addArticle } from "./add-article";
import { parseAddArticleFormData } from "./helpers/form-data-parser";

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	hasDumperPostPermission: vi.fn(),
}));

vi.mock(
	"@/infrastructures/articles/repositories/articles-command-repository",
	() => ({ articlesCommandRepository: { create: vi.fn() } }),
);

vi.mock(
	"@/infrastructures/articles/repositories/articles-query-repository",
	() => ({
		articlesQueryRepository: {},
	}),
);

const mockEnsureNoDuplicate = vi.fn();

vi.mock("s-private-domains/articles/services/articles-domain-service", () => ({
	ArticlesDomainService: vi.fn().mockImplementation(() => ({
		ensureNoDuplicate: mockEnsureNoDuplicate,
	})),
}));

vi.mock(
	"s-private-domains/articles/entities/article-entity",
	async (importOriginal) => {
		const actual = (await importOriginal()) as any;
		return {
			...actual,
			articleEntity: {
				create: vi.fn(),
			},
		};
	},
);

vi.mock("./helpers/form-data-parser", () => ({
	parseAddArticleFormData: vi.fn(),
}));

const mockFormData = new FormData();
mockFormData.append("title", "Test Article");
mockFormData.append("url", "https://example.com/article");
mockFormData.append("quote", "Test quote");
mockFormData.append("category", "tech");

describe("addArticle", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(parseAddArticleFormData).mockReturnValue({
			title: makeArticleTitle("Test Article"),
			url: makeUrl("https://example.com/article"),
			quote: makeQuote("Test quote"),
			categoryName: makeCategoryName("tech"),
			userId: makeUserId("user-123"),
		});
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

	test("should create article", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-123"));

		const mockArticle = {
			id: makeId("01933f5c-9df0-7001-9123-456789abcdef"),
			title: makeArticleTitle("Test Article"),
			url: makeUrl("https://example.com/article"),
			quote: makeQuote("Test quote"),
			categoryName: makeCategoryName("tech"),
			categoryId: makeId("01933f5c-9df0-7001-8123-456789abcde0"),
			userId: makeUserId("user-123"),
			status: "UNEXPORTED",
			createdAt: makeCreatedAt(),
		} as const;

		mockEnsureNoDuplicate.mockResolvedValue(undefined);
		vi.mocked(articleEntity.create).mockReturnValue(mockArticle);
		vi.mocked(articlesCommandRepository.create).mockResolvedValue();

		const result = await addArticle(mockFormData);

		expect(vi.mocked(hasDumperPostPermission)).toHaveBeenCalled();
		expect(mockEnsureNoDuplicate).toHaveBeenCalledWith(
			makeUrl("https://example.com/article"),
			makeUserId("user-123"),
		);
		expect(articleEntity.create).toHaveBeenCalled();
		expect(articlesCommandRepository.create).toHaveBeenCalledWith(mockArticle);
		const status = makeUnexportedStatus();
		expect(revalidateTag).toHaveBeenCalledWith(
			buildContentCacheTag("articles", status, "user-123"),
		);
		expect(revalidateTag).toHaveBeenCalledWith(
			buildCountCacheTag("articles", status, "user-123"),
		);

		expect(result.success).toBe(true);
		expect(result.message).toBe("inserted");
	});

	test("should preserve form data on DuplicateError", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-123"));
		mockEnsureNoDuplicate.mockRejectedValue(new DuplicateError());

		const result = await addArticle(mockFormData);

		expect(result.success).toBe(false);
		expect(result.message).toBe("duplicated");
		expect(result.formData).toEqual({
			title: "Test Article",
			url: "https://example.com/article",
			quote: "Test quote",
			category: "tech",
		});
	});

	test("should handle errors and return wrapped error", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-123"));

		const error = new Error("Domain service error");
		mockEnsureNoDuplicate.mockRejectedValue(error);

		const result = await addArticle(mockFormData);

		expect(result).toEqual({ success: false, message: "unexpected" });
	});
});

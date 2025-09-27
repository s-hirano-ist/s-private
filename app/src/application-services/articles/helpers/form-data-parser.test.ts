import {
	makeArticleTitle,
	makeCategoryName,
	makeQuote,
	makeUrl,
} from "s-private-domains/articles/entities/article-entity";
import { makeUserId } from "s-private-domains/common/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getFormDataString } from "@/common/utils/form-data-utils";
import { parseAddArticleFormData } from "./form-data-parser";

vi.mock("@/common/utils/form-data-utils");
vi.mock("s-private-domains/articles/entities/article-entity");
vi.mock("s-private-domains/common/entities/common-entity");

const mockGetFormDataString = vi.mocked(getFormDataString);
const mockMakeArticleTitle = vi.mocked(makeArticleTitle);
const mockMakeQuote = vi.mocked(makeQuote);
const mockMakeUrl = vi.mocked(makeUrl);
const mockMakeCategoryName = vi.mocked(makeCategoryName);
const mockMakeUserId = vi.mocked(makeUserId);

describe("parseAddArticleFormData", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should parse form data and create article data", () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id");

		// Mock form data extraction
		mockGetFormDataString
			.mockReturnValueOnce("Test Article Title")
			.mockReturnValueOnce("This is a test quote")
			.mockReturnValueOnce("https://example.com")
			.mockReturnValueOnce("Technology");

		// Mock entity creation
		mockMakeArticleTitle.mockReturnValue("Test Article Title" as any);
		mockMakeQuote.mockReturnValue("This is a test quote" as any);
		mockMakeUrl.mockReturnValue("https://example.com" as any);
		mockMakeCategoryName.mockReturnValue("Technology" as any);
		mockMakeUserId.mockReturnValue(userId);

		const result = parseAddArticleFormData(formData, userId);

		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "title");
		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "quote");
		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "url");
		expect(mockGetFormDataString).toHaveBeenCalledWith(formData, "category");

		expect(mockMakeArticleTitle).toHaveBeenCalledWith("Test Article Title");
		expect(mockMakeQuote).toHaveBeenCalledWith("This is a test quote");
		expect(mockMakeUrl).toHaveBeenCalledWith("https://example.com");
		expect(mockMakeCategoryName).toHaveBeenCalledWith("Technology");
		expect(mockMakeUserId).toHaveBeenCalledWith(userId);

		expect(result).toEqual({
			title: "Test Article Title",
			quote: "This is a test quote",
			url: "https://example.com",
			categoryName: "Technology",
			userId: "test-user-id",
		});
	});

	test("should handle empty form data", () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id");

		// Mock form data extraction returning empty strings
		mockGetFormDataString
			.mockReturnValueOnce("")
			.mockReturnValueOnce("")
			.mockReturnValueOnce("")
			.mockReturnValueOnce("");

		// Mock entity creation
		mockMakeArticleTitle.mockReturnValue("" as any);
		mockMakeQuote.mockReturnValue("" as any);
		mockMakeUrl.mockReturnValue("" as any);
		mockMakeCategoryName.mockReturnValue("" as any);
		mockMakeUserId.mockReturnValue(userId);

		const result = parseAddArticleFormData(formData, userId);

		expect(result).toEqual({
			title: "",
			quote: "",
			url: "",
			categoryName: "",
			userId: "test-user-id",
		});
	});

	test("should handle form data with Japanese content", () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id-jp");

		// Mock form data extraction with Japanese content
		mockGetFormDataString
			.mockReturnValueOnce("テスト記事タイトル")
			.mockReturnValueOnce("これはテストの引用です")
			.mockReturnValueOnce("https://example.co.jp")
			.mockReturnValueOnce("技術");

		// Mock entity creation
		mockMakeArticleTitle.mockReturnValue("テスト記事タイトル" as any);
		mockMakeQuote.mockReturnValue("これはテストの引用です" as any);
		mockMakeUrl.mockReturnValue("https://example.co.jp" as any);
		mockMakeCategoryName.mockReturnValue("技術" as any);
		mockMakeUserId.mockReturnValue(userId);

		const result = parseAddArticleFormData(formData, userId);

		expect(result).toEqual({
			title: "テスト記事タイトル",
			quote: "これはテストの引用です",
			url: "https://example.co.jp",
			categoryName: "技術",
			userId: "test-user-id-jp",
		});
	});

	test("should handle form data with special characters", () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id");

		// Mock form data extraction with special characters
		mockGetFormDataString
			.mockReturnValueOnce('Article with "quotes" & symbols')
			.mockReturnValueOnce("Quote with <tags> and & symbols")
			.mockReturnValueOnce("https://example.com/path?param=value&other=test")
			.mockReturnValueOnce("Web & Development");

		// Mock entity creation
		mockMakeArticleTitle.mockReturnValue(
			'Article with "quotes" & symbols' as any,
		);
		mockMakeQuote.mockReturnValue("Quote with <tags> and & symbols" as any);
		mockMakeUrl.mockReturnValue(
			"https://example.com/path?param=value&other=test" as any,
		);
		mockMakeCategoryName.mockReturnValue("Web & Development" as any);
		mockMakeUserId.mockReturnValue(userId);

		const result = parseAddArticleFormData(formData, userId);

		expect(result).toEqual({
			title: 'Article with "quotes" & symbols',
			quote: "Quote with <tags> and & symbols",
			url: "https://example.com/path?param=value&other=test",
			categoryName: "Web & Development",
			userId: "test-user-id",
		});
	});
});

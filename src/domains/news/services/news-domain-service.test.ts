import { describe, expect, test } from "vitest";
import { validateNews } from "@/domains/news/services/news-domain-service";
import type { INewsQueryRepository } from "@/domains/news/types";
import { InvalidFormatError } from "@/utils/error/error-classes";

const mockNewsQueryRepository: INewsQueryRepository = {
	findByUrl: async () => null,
	findMany: async () => [],
	count: async () => 0,
};

describe.skip("validateNews", () => {
	test("should validate correct news data", async () => {
		const formData = new FormData();
		formData.append("category", "1");
		formData.append("title", "Breaking News");
		formData.append("quote", "This is a short quote.");
		formData.append("url", "https://example.com/news");

		const result = await validateNews(
			formData,
			"user-s123",
			mockNewsQueryRepository,
		);

		expect(result.categoryName).toBe("1");
		expect(result.title).toBe("Breaking News");
		expect(result.quote).toBe("This is a short quote.");
		expect(result.url).toBe("https://example.com/news");
		expect(result.userId).toBe("user-s123");
		expect(typeof result.id).toBe("string");
		expect(result.id.length).toBeGreaterThan(0);
	});

	test("should throw InvalidFormatError when categoryId is invalid", async () => {
		const formData = new FormData();
		formData.append("category", "");
		formData.append("title", "Breaking News");
		formData.append("quote", "This is a short quote.");
		formData.append("url", "https://example.com/news");

		await expect(() =>
			validateNews(formData, "user-s123", mockNewsQueryRepository),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when title is missing", async () => {
		const formData = new FormData();
		formData.append("category", "sample-category");
		formData.append("quote", "This is a short quote.");
		formData.append("url", "https://example.com/news");

		await expect(() =>
			validateNews(formData, "user-s123", mockNewsQueryRepository),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when url is not a valid URL", async () => {
		const formData = new FormData();
		formData.append("category", "1");
		formData.append("title", "Breaking News");
		formData.append("quote", "This is a short quote.");
		formData.append("url", "invalid-url");

		await expect(() =>
			validateNews(formData, "user-s123", mockNewsQueryRepository),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should handle optional quote field", async () => {
		const formData = new FormData();
		formData.append("category", "1");
		formData.append("title", "Breaking News");
		formData.append("url", "https://example.com/news");

		const result = await validateNews(
			formData,
			"user-s123",
			mockNewsQueryRepository,
		);

		expect(result.categoryName).toBe("1");
		expect(result.title).toBe("Breaking News");
		expect(result.quote).toBe(null);
		expect(result.url).toBe("https://example.com/news");
		expect(result.userId).toBe("user-s123");
		expect(typeof result.id).toBe("string");
		expect(result.id.length).toBeGreaterThan(0);
	});

	test("should handle empty optional fields gracefully", async () => {
		const formData = new FormData();
		formData.append("category", "1");
		formData.append("title", "Breaking News");
		formData.append("quote", "");
		formData.append("url", "https://example.com/news");

		const result = await validateNews(
			formData,
			"user-s123",
			mockNewsQueryRepository,
		);

		expect(result.categoryName).toBe("1");
		expect(result.title).toBe("Breaking News");
		expect(result.quote).toBe("");
		expect(result.url).toBe("https://example.com/news");
		expect(result.userId).toBe("user-s123");
		expect(typeof result.id).toBe("string");
		expect(result.id.length).toBeGreaterThan(0);
	});
});

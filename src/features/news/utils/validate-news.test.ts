import { InvalidFormatError } from "@/error-classes";
import { validateNews } from "@/features/news/utils/validate-news";
import { describe, expect, test } from "vitest";

describe("validateNews", () => {
	test("should validate correct news data", () => {
		const formData = new FormData();
		formData.append("category", "1");
		formData.append("title", "Breaking News");
		formData.append("quote", "This is a short quote.");
		formData.append("url", "https://example.com/news");

		const result = validateNews(formData);

		expect(result).toEqual({
			categoryId: 1,
			title: "Breaking News",
			quote: "This is a short quote.",
			url: "https://example.com/news",
		});
	});

	test("should throw InvalidFormatError when categoryId is invalid", () => {
		const formData = new FormData();
		formData.append("category", "invalid");
		formData.append("title", "Breaking News");
		formData.append("quote", "This is a short quote.");
		formData.append("url", "https://example.com/news");

		expect(() => validateNews(formData)).toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when title is missing", () => {
		const formData = new FormData();
		formData.append("category", "1");
		formData.append("quote", "This is a short quote.");
		formData.append("url", "https://example.com/news");

		expect(() => validateNews(formData)).toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when url is not a valid URL", () => {
		const formData = new FormData();
		formData.append("category", "1");
		formData.append("title", "Breaking News");
		formData.append("quote", "This is a short quote.");
		formData.append("url", "invalid-url");

		expect(() => validateNews(formData)).toThrow(InvalidFormatError);
	});

	test("should handle optional quote field", () => {
		const formData = new FormData();
		formData.append("category", "1");
		formData.append("title", "Breaking News");
		formData.append("url", "https://example.com/news");

		const result = validateNews(formData);

		expect(result).toEqual({
			categoryId: 1,
			title: "Breaking News",
			quote: null,
			url: "https://example.com/news",
		});
	});

	test("should handle empty optional fields gracefully", () => {
		const formData = new FormData();
		formData.append("category", "1");
		formData.append("title", "Breaking News");
		formData.append("quote", "");
		formData.append("url", "https://example.com/news");

		const result = validateNews(formData);

		expect(result).toEqual({
			categoryId: 1,
			title: "Breaking News",
			quote: "",
			url: "https://example.com/news",
		});
	});
});

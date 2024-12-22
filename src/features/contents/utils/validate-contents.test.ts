import { InvalidFormatError } from "@/error-classes";
import { validateContents } from "@/features/contents/utils/validate-contents";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => {
	return {};
});

describe("validateContents", () => {
	it("should validate correct contents data", () => {
		const formData = new FormData();
		formData.append("title", "Content Title");
		formData.append("quote", "This is a short quote.");
		formData.append("url", "https://example.com/contents");

		const result = validateContents(formData);

		expect(result).toEqual({
			title: "Content Title",
			quote: "This is a short quote.",
			url: "https://example.com/contents",
		});
	});

	it("should throw InvalidFormatError when title is missing", () => {
		const formData = new FormData();
		formData.append("quote", "This is a short quote.");
		formData.append("url", "https://example.com/contents");

		expect(() => validateContents(formData)).toThrow(InvalidFormatError);
	});

	it("should throw InvalidFormatError when url is missing", () => {
		const formData = new FormData();
		formData.append("title", "Content Title");
		formData.append("quote", "This is a short quote.");

		expect(() => validateContents(formData)).toThrow(InvalidFormatError);
	});

	it("should throw InvalidFormatError when url is not a valid URL", () => {
		const formData = new FormData();
		formData.append("title", "Content Title");
		formData.append("quote", "This is a short quote.");
		formData.append("url", "invalid-url");

		expect(() => validateContents(formData)).toThrow(InvalidFormatError);
	});

	it("should handle optional quote field", () => {
		const formData = new FormData();
		formData.append("title", "Content Title");
		formData.append("url", "https://example.com/contents");

		const result = validateContents(formData);

		expect(result).toEqual({
			title: "Content Title",
			quote: null,
			url: "https://example.com/contents",
		});
	});

	it("should handle empty optional quote field", () => {
		const formData = new FormData();
		formData.append("title", "Content Title");
		formData.append("quote", "");
		formData.append("url", "https://example.com/contents");

		const result = validateContents(formData);

		expect(result).toEqual({
			title: "Content Title",
			quote: "",
			url: "https://example.com/contents",
		});
	});
});
import { describe, expect, test } from "vitest";
import { validateContents } from "@/features/contents/utils/validate-contents";
import { InvalidFormatError } from "@/utils/error/error-classes";

describe("validateContents", () => {
	test("should validate correct contents data", () => {
		const formData = new FormData();
		formData.append("title", "Content Title");
		formData.append("markdown", "This is a short quote.");

		const result = validateContents(formData);

		expect(result).toEqual({
			title: "Content Title",
			markdown: "This is a short quote.",
		});
	});

	test("should throw InvalidFormatError when title is missing", () => {
		const formData = new FormData();
		formData.append("markdown", "This is a short quote.");

		expect(() => validateContents(formData)).toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when markdown is missing", () => {
		const formData = new FormData();
		formData.append("title", "Content Title");

		expect(() => validateContents(formData)).toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when markdown is empty", () => {
		const formData = new FormData();
		formData.append("title", "Content Title");
		formData.append("markdown", "");

		expect(() => validateContents(formData)).toThrow(InvalidFormatError);
	});

	test("should validate with valid markdown", () => {
		const formData = new FormData();
		formData.append("title", "Content Title");
		formData.append("markdown", "Valid markdown content");

		const result = validateContents(formData);

		expect(result).toEqual({
			title: "Content Title",
			markdown: "Valid markdown content",
		});
	});

	test("should throw InvalidFormatError when title is empty", () => {
		const formData = new FormData();
		formData.append("title", "");
		formData.append("markdown", "Valid markdown");

		expect(() => validateContents(formData)).toThrow(InvalidFormatError);
	});
});

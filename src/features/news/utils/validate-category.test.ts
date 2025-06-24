import { describe, expect, test } from "vitest";
import { InvalidFormatError } from "@/error-classes";
import { validateCategory } from "@/features/news/utils/validate-category";

describe("validateCategory", () => {
	test("should validate correct category name", () => {
		const formData = new FormData();
		formData.append("category", "News");

		const result = validateCategory(formData);

		expect(result).toEqual({
			name: "News",
		});
	});

	test("should throw InvalidFormatError when category name exceeds max length", () => {
		const formData = new FormData();
		formData.append("category", "a".repeat(17)); // Exceeds 16 characters

		expect(() => validateCategory(formData)).toThrow(InvalidFormatError);
	});

	test("should trim whitespace and validate", () => {
		const formData = new FormData();
		formData.append("category", "   News   ");

		const result = validateCategory(formData);

		expect(result).toEqual({
			name: "News",
		});
	});

	test("should handle empty category name gracefully", () => {
		const formData = new FormData();
		formData.append("category", "");
		expect(() => validateCategory(formData)).toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when formData is missing the field", () => {
		const formData = new FormData();

		expect(() => validateCategory(formData)).toThrow(InvalidFormatError);
	});
});

import { InvalidFormatError } from "@/error-classes";
import { validateCategory } from "@/features/news/utils/validate-category";
import { describe, expect, it, vi } from "vitest";

describe("validateCategory", () => {
	it("should validate correct category name", () => {
		const formData = new FormData();
		formData.append("category", "News");

		const result = validateCategory(formData);

		expect(result).toEqual({
			name: "News",
		});
	});

	it("should throw InvalidFormatError when category name exceeds max length", () => {
		const formData = new FormData();
		formData.append("category", "a".repeat(17)); // Exceeds 16 characters

		expect(() => validateCategory(formData)).toThrow(InvalidFormatError);
	});

	it("should trim whitespace and validate", () => {
		const formData = new FormData();
		formData.append("category", "   News   ");

		const result = validateCategory(formData);

		expect(result).toEqual({
			name: "News",
		});
	});

	it("should handle empty category name gracefully", () => {
		const formData = new FormData();
		formData.append("category", "");
		expect(() => validateCategory(formData)).toThrow(InvalidFormatError);
	});

	it("should throw InvalidFormatError when formData is missing the field", () => {
		const formData = new FormData();

		expect(() => validateCategory(formData)).toThrow(InvalidFormatError);
	});
});

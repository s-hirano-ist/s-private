import { FORM_ERROR_MESSAGES } from "@/constants";
import { describe, expect, it } from "vitest";
import { categorySchema } from "./category-schema";

describe("categorySchema", () => {
	it("should validate correct category name", () => {
		const validData = {
			name: "CategoryName",
		};

		const result = categorySchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should fail when name exceeds max length", () => {
		const invalidData = {
			name: "a".repeat(17),
		};

		const result = categorySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe(FORM_ERROR_MESSAGES.TOO_LONG);
		}
	});

	it("should trim whitespace and validate", () => {
		const validData = {
			name: "   CategoryName   ",
		};

		const result = categorySchema.safeParse(validData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("CategoryName");
		}
	});

	it("should pass when name is an empty string after trimming", () => {
		const invalidData = {
			name: "   ",
		};

		const result = categorySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe(FORM_ERROR_MESSAGES.REQUIRED);
		}
	});

	it("should pass when name is an empty string", () => {
		const invalidData = {
			name: "",
		};

		const result = categorySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe(FORM_ERROR_MESSAGES.REQUIRED);
		}
	});
});

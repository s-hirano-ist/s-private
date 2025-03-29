import { describe, expect, test } from "vitest";
import { categorySchema } from "./category-schema";

describe("categorySchema", () => {
	test("should validate correct category name", () => {
		const validData = {
			name: "CategoryName",
		};

		const result = categorySchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	test("should fail when name exceeds max length", () => {
		const invalidData = {
			name: "a".repeat(17),
		};

		const result = categorySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("tooLong");
		}
	});

	test("should trim whitespace and validate", () => {
		const validData = {
			name: "   CategoryName   ",
		};

		const result = categorySchema.safeParse(validData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("CategoryName");
		}
	});

	test("should pass when name is an empty string after trimming", () => {
		const invalidData = {
			name: "   ",
		};

		const result = categorySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("required");
		}
	});

	test("should pass when name is an empty string", () => {
		const invalidData = {
			name: "",
		};

		const result = categorySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("required");
		}
	});
});

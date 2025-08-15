import { describe, expect, test } from "vitest";
import { contentsFormSchema } from "./contents-entity";

describe("contentsEntity", () => {
	test("should validate correct contents data", () => {
		const validData = {
			title: "Sample Content",
			markdown: "# This is markdown content",
			userId: "user-123",
			id: "test-id-1",
		};

		const result = contentsFormSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	test("should fail when title is empty", () => {
		const invalidData = {
			title: "",
			markdown: "# This is markdown content",
			userId: "user-123",
			id: "test-id-2",
		};

		const result = contentsFormSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("required");
		}
	});

	test("should fail when title exceeds max length", () => {
		const invalidData = {
			title: "a".repeat(65),
			markdown: "# This is markdown content",
			userId: "user-123",
			id: "test-id-3",
		};

		const result = contentsFormSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("tooLong");
		}
	});

	test("should fail when markdown is empty", () => {
		const invalidData = {
			title: "Sample Content",
			markdown: "",
			userId: "user-123",
			id: "test-id-4",
		};

		const result = contentsFormSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("required");
		}
	});

	test("should fail when userId is missing", () => {
		const invalidData = {
			title: "Sample Content",
			markdown: "# This is markdown content",
			userId: undefined,
			id: "test-id-5",
		};

		const result = contentsFormSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("required");
		}
	});
});

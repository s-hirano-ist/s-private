import { describe, expect, test } from "vitest";
import { categoryNameSchema, newsFormSchema } from "./news-entity";

describe("newsEntity", () => {
	test("should validate correct news data", () => {
		const validData = {
			categoryName: "1",
			title: "Breaking News",
			quote: "This is a short quote.",
			url: "https://example.com/news",
			userId: "user-s123",
			id: "test-id-1",
		};

		const result = newsFormSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	test("should fail when title is empty", () => {
		const invalidData = {
			categoryName: "1",
			title: "",
			quote: "This is a short quote.",
			url: "https://example.com/news",
			userId: "user-s123",
			id: "test-id-2",
		};

		const result = newsFormSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("required");
		}
	});

	test("should fail when title exceeds max length", () => {
		const invalidData = {
			categoryName: "1",
			title: "a".repeat(65),
			quote: "This is a short quote.",
			url: "https://example.com/news",
			userId: "user-s123",
		};

		const result = newsFormSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("tooLong");
		}
	});

	test("should fail when quote exceeds max length", () => {
		const invalidData = {
			categoryName: "1",
			title: "Breaking News",
			quote: "a".repeat(257),
			url: "https://example.com/news",
			userId: "user-s123",
		};

		const result = newsFormSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("tooLong");
		}
	});

	test("should validate when quote is null", () => {
		const validData = {
			categoryName: "1",
			title: "Breaking News",
			quote: null,
			url: "https://example.com/news",
			userId: "user-s123",
			id: "test-id-3",
		};

		const result = newsFormSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	test("should fail when url is empty", () => {
		const invalidData = {
			categoryName: "1",
			title: "Breaking News",
			quote: "This is a short quote.",
			url: undefined,
			userId: "user-s123",
		};

		const result = newsFormSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("required");
		}
	});

	test("should fail when url is not a valid URL", () => {
		const invalidData = {
			categoryName: "1",
			title: "Breaking News",
			quote: "This is a short quote.",
			url: "invalid-url",
			userId: "user-s123",
		};

		const result = newsFormSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("invalidFormat");
		}
	});
});

describe("categorySchema", () => {
	test("should validate correct category name", () => {
		const validData = "CategoryName";

		const result = categoryNameSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	test("should fail when name exceeds max length", () => {
		const invalidData = "a".repeat(17);

		const result = categoryNameSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("tooLong");
		}
	});

	test("should trim whitespace and validate", () => {
		const validData = "   Name   ";

		const result = categoryNameSchema.safeParse(validData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toBe("Name");
		}
	});

	test("should pass when name is an empty string after trimming", () => {
		const invalidData = "   ";

		const result = categoryNameSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("required");
		}
	});

	test("should pass when name is an empty string", () => {
		const invalidData = "";

		const result = categoryNameSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("required");
		}
	});
});

import { describe, expect, test } from "vitest";
import { newsSchema } from "./news-schema";

describe("newsSchema", () => {
	test("should validate correct news data", () => {
		const validData = {
			categoryId: 1,
			title: "Breaking News",
			quote: "This is a short quote.",
			url: "https://example.com/news",
		};

		const result = newsSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	test("should fail when categoryId is not a number", () => {
		const invalidData = {
			categoryId: "not-a-number",
			title: "Breaking News",
			quote: "This is a short quote.",
			url: "https://example.com/news",
		};

		const result = newsSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe(
				"Expected number, received string",
			);
		}
	});

	test("should fail when title is empty", () => {
		const invalidData = {
			categoryId: 1,
			title: "",
			quote: "This is a short quote.",
			url: "https://example.com/news",
		};

		const result = newsSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("required");
		}
	});

	test("should fail when title exceeds max length", () => {
		const invalidData = {
			categoryId: 1,
			title: "a".repeat(65),
			quote: "This is a short quote.",
			url: "https://example.com/news",
		};

		const result = newsSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("tooLong");
		}
	});

	test("should fail when quote exceeds max length", () => {
		const invalidData = {
			categoryId: 1,
			title: "Breaking News",
			quote: "a".repeat(257),
			url: "https://example.com/news",
		};

		const result = newsSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("tooLong");
		}
	});

	test("should validate when quote is null", () => {
		const validData = {
			categoryId: 1,
			title: "Breaking News",
			quote: null,
			url: "https://example.com/news",
		};

		const result = newsSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	test("should fail when url is empty", () => {
		const invalidData = {
			categoryId: 1,
			title: "Breaking News",
			quote: "This is a short quote.",
			url: undefined,
		};

		const result = newsSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("required");
		}
	});

	test("should fail when url is not a valid URL", () => {
		const invalidData = {
			categoryId: 1,
			title: "Breaking News",
			quote: "This is a short quote.",
			url: "invalid-url",
		};

		const result = newsSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe("invalidFormat");
		}
	});
});

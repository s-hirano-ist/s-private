import { FORM_ERROR_MESSAGES } from "@/constants";
import { describe, expect, it } from "vitest";
import { newsSchema } from "./news-schema";

describe("newsSchema", () => {
	it("should validate correct news data", () => {
		const validData = {
			categoryId: 1,
			title: "Breaking News",
			quote: "This is a short quote.",
			url: "https://example.com/news",
		};

		const result = newsSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should fail when categoryId is not a number", () => {
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

	it("should fail when title is empty", () => {
		const invalidData = {
			categoryId: 1,
			title: "",
			quote: "This is a short quote.",
			url: "https://example.com/news",
		};

		const result = newsSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe(FORM_ERROR_MESSAGES.REQUIRED);
		}
	});

	it("should fail when title exceeds max length", () => {
		const invalidData = {
			categoryId: 1,
			title: "a".repeat(65),
			quote: "This is a short quote.",
			url: "https://example.com/news",
		};

		const result = newsSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe(FORM_ERROR_MESSAGES.TOO_LONG);
		}
	});

	it("should fail when quote exceeds max length", () => {
		const invalidData = {
			categoryId: 1,
			title: "Breaking News",
			quote: "a".repeat(257),
			url: "https://example.com/news",
		};

		const result = newsSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe(FORM_ERROR_MESSAGES.TOO_LONG);
		}
	});

	it("should validate when quote is null", () => {
		const validData = {
			categoryId: 1,
			title: "Breaking News",
			quote: null,
			url: "https://example.com/news",
		};

		const result = newsSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should fail when url is empty", () => {
		const invalidData = {
			categoryId: 1,
			title: "Breaking News",
			quote: "This is a short quote.",
			url: undefined,
		};

		const result = newsSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe(FORM_ERROR_MESSAGES.REQUIRED);
		}
	});

	it("should fail when url is not a valid URL", () => {
		const invalidData = {
			categoryId: 1,
			title: "Breaking News",
			quote: "This is a short quote.",
			url: "invalid-url",
		};

		const result = newsSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toBe(
				FORM_ERROR_MESSAGES.INVALID_FORMAT,
			);
		}
	});
});

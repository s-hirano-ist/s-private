import { describe, expect, test } from "vitest";
import {
	categoryInputSchema,
	categoryQueryData,
	newsAdditionalSchema,
	newsInputSchema,
	newsQueryData,
} from "./news-entity";

describe("newsEntity", () => {
	describe("categoryInputSchema", () => {
		test("should validate correct category data", () => {
			const validData = {
				name: "tech",
				userId: "user-123",
			};

			const result = categoryInputSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		test("should fail when name is empty", () => {
			const invalidData = {
				name: "",
				userId: "user-123",
			};

			const result = categoryInputSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test("should fail when name exceeds max length", () => {
			const invalidData = {
				name: "a".repeat(17),
				userId: "user-123",
			};

			const result = categoryInputSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test("should trim name", () => {
			const validData = {
				name: "  tech  ",
				userId: "user-123",
			};

			const result = categoryInputSchema.safeParse(validData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("tech");
			}
		});
	});

	describe("newsInputSchema", () => {
		test("should validate correct news data", () => {
			const validData = {
				category: {
					name: "tech",
					userId: "user-123",
				},
				title: "Sample News",
				quote: "This is a sample quote",
				url: "https://example.com",
				userId: "user-123",
				status: "UNEXPORTED",
			};

			const result = newsInputSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		test("should accept null quote", () => {
			const validData = {
				category: {
					name: "tech",
					userId: "user-123",
				},
				title: "Sample News",
				quote: null,
				url: "https://example.com",
				userId: "user-123",
				status: "UNEXPORTED",
			};

			const result = newsInputSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		test("should fail with invalid URL", () => {
			const invalidData = {
				category: {
					name: "tech",
					userId: "user-123",
				},
				title: "Sample News",
				url: "not-a-url",
				userId: "user-123",
				status: "UNEXPORTED",
			};

			const result = newsInputSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test("should fail with non-http(s) URL", () => {
			const invalidData = {
				category: {
					name: "tech",
					userId: "user-123",
				},
				title: "Sample News",
				url: "ftp://example.com",
				userId: "user-123",
				status: "UNEXPORTED",
			};

			const result = newsInputSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test("should fail when title exceeds max length", () => {
			const invalidData = {
				category: {
					name: "tech",
					userId: "user-123",
				},
				title: "a".repeat(65),
				url: "https://example.com",
				userId: "user-123",
				status: "UNEXPORTED",
			};

			const result = newsInputSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test("should fail when quote exceeds max length", () => {
			const invalidData = {
				category: {
					name: "tech",
					userId: "user-123",
				},
				title: "Sample News",
				quote: "a".repeat(257),
				url: "https://example.com",
				userId: "user-123",
				status: "UNEXPORTED",
			};

			const result = newsInputSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe("newsAdditionalSchema", () => {
		test("should validate additional data", () => {
			const validData = {
				ogTitle: "OG Title",
				ogDescription: "OG Description",
			};

			const result = newsAdditionalSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		test("should accept null values", () => {
			const validData = {
				ogTitle: null,
				ogDescription: null,
			};

			const result = newsAdditionalSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("query schemas", () => {
		test("categoryQueryData should omit userId", () => {
			const data = {
				name: "tech",
				id: "01234567-89ab-4def-9123-456789abcdef",
			};

			const result = categoryQueryData.safeParse(data);
			expect(result.success).toBe(true);
		});

		test("newsQueryData should handle complex structure", () => {
			const data = {
				category: {
					name: "tech",
					id: "01234567-89ab-4def-9123-456789abcdef",
				},
				title: "Sample News",
				quote: "Quote",
				url: "https://example.com",
				id: "01234567-89ab-4def-9123-456789abcdef",
				ogTitle: "OG Title",
				ogDescription: "OG Description",
			};

			const result = newsQueryData.safeParse(data);
			expect(result.success).toBe(true);
		});
	});
});

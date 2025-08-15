import { describe, expect, test, vi } from "vitest";
import {
	booksAdditionalSchema,
	booksFormSchema,
	booksInputSchema,
	booksQueryData,
} from "./books-entity";

describe("booksEntity", () => {
	describe("booksInputSchema", () => {
		test("should validate correct books data", () => {
			const validData = {
				ISBN: "978-0123456789",
				title: "Sample Book",
				userId: "user-123",
				status: "UNEXPORTED",
			};

			const result = booksInputSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		test("should fail when ISBN is empty", () => {
			const invalidData = {
				ISBN: "",
				title: "Sample Book",
				userId: "user-123",
				status: "UNEXPORTED",
			};

			const result = booksInputSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test("should fail when ISBN exceeds max length", () => {
			const invalidData = {
				ISBN: "1".repeat(18),
				title: "Sample Book",
				userId: "user-123",
				status: "UNEXPORTED",
			};

			const result = booksInputSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test("should fail when ISBN has invalid format", () => {
			const invalidData = {
				ISBN: "abc-123",
				title: "Sample Book",
				userId: "user-123",
				status: "UNEXPORTED",
			};

			const result = booksInputSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test("should accept valid ISBN with hyphens", () => {
			const validData = {
				ISBN: "978-0-123-45678-9",
				title: "Sample Book",
				userId: "user-123",
				status: "UNEXPORTED",
			};

			const result = booksInputSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		test("should fail when title exceeds max length", () => {
			const invalidData = {
				ISBN: "978-0123456789",
				title: "a".repeat(257),
				userId: "user-123",
				status: "UNEXPORTED",
			};

			const result = booksInputSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test("should fail when title is empty", () => {
			const invalidData = {
				ISBN: "978-0123456789",
				title: "",
				userId: "user-123",
				status: "UNEXPORTED",
			};

			const result = booksInputSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe("booksAdditionalSchema", () => {
		test("should validate additional book data", () => {
			const validData = {
				googleTitle: "Google Title",
				googleSubTitle: "Subtitle",
				googleAuthors: ["Author 1", "Author 2"],
				googleDescription: "Description",
				googleImgSrc: "https://example.com/image.jpg",
				googleHref: "https://example.com",
				markdown: "# Book Notes",
			};

			const result = booksAdditionalSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		test("should accept null values", () => {
			const validData = {
				googleTitle: null,
				googleSubTitle: null,
				googleAuthors: null,
				googleDescription: null,
				googleImgSrc: null,
				googleHref: null,
				markdown: null,
			};

			const result = booksAdditionalSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		test("should accept empty object", () => {
			const validData = {};

			const result = booksAdditionalSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("booksQueryData", () => {
		test("should handle merged schema and omit userId and status", () => {
			const data = {
				ISBN: "978-0123456789",
				title: "Sample Book",
				id: "01234567-89ab-cdef-0123-456789abcdef",
				googleTitle: "Google Title",
				googleAuthors: ["Author"],
				markdown: "# Notes",
			};

			const result = booksQueryData.safeParse(data);
			expect(result.success).toBe(true);
		});
	});

	describe("booksFormSchema", () => {
		test("should be identical to booksInputSchema", () => {
			const validData = {
				ISBN: "978-0123456789",
				title: "Sample Book",
				userId: "user-123",
				status: "UNEXPORTED",
			};

			const inputResult = booksInputSchema.safeParse(validData);
			const formResult = booksFormSchema.safeParse(validData);

			expect(inputResult.success).toBe(formResult.success);
			expect(inputResult.success).toBe(true);
		});
	});
});

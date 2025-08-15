import { describe, expect, test } from "vitest";
import { validateBooks } from "@/domains/books/services/books-domain-service";
import type { IBooksQueryRepository } from "@/domains/books/types";
import { InvalidFormatError } from "@/utils/error/error-classes";

const mockBooksQueryRepository: IBooksQueryRepository = {
	findByISBN: async () => null,
	findMany: async () => [],
	count: async () => 0,
};

describe.skip("validateBooks", () => {
	test("should validate correct books data", async () => {
		const formData = new FormData();
		formData.append("isbn", "978-4-06-519981-0");
		formData.append("title", "Sample Book Title");

		const result = await validateBooks(
			formData,
			"user-123",
			mockBooksQueryRepository,
		);

		expect(result.ISBN).toBe("978-4-06-519981-0");
		expect(result.title).toBe("Sample Book Title");
	});

	test("should throw InvalidFormatError when ISBN is missing", async () => {
		const formData = new FormData();
		formData.append("title", "Sample Book Title");

		await expect(() =>
			validateBooks(formData, "user-123", mockBooksQueryRepository),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when ISBN is empty", async () => {
		const formData = new FormData();
		formData.append("isbn", "");
		formData.append("title", "Sample Book Title");

		await expect(() =>
			validateBooks(formData, "user-123", mockBooksQueryRepository),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when title is missing", async () => {
		const formData = new FormData();
		formData.append("isbn", "978-4-06-519981-0");

		await expect(() =>
			validateBooks(formData, "user-123", mockBooksQueryRepository),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when title is empty", async () => {
		const formData = new FormData();
		formData.append("isbn", "978-4-06-519981-0");
		formData.append("title", "");

		await expect(() =>
			validateBooks(formData, "user-123", mockBooksQueryRepository),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when ISBN has invalid format", async () => {
		const formData = new FormData();
		formData.append("isbn", "ABC-123-DEF");
		formData.append("title", "Sample Book Title");

		await expect(() =>
			validateBooks(formData, "user-123", mockBooksQueryRepository),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when ISBN exceeds max length", async () => {
		const formData = new FormData();
		formData.append("isbn", "1".repeat(18));
		formData.append("title", "Sample Book Title");

		await expect(() =>
			validateBooks(formData, "user-123", mockBooksQueryRepository),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when title exceeds max length", async () => {
		const formData = new FormData();
		formData.append("isbn", "978-4-06-519981-0");
		formData.append("title", "a".repeat(257));

		await expect(() =>
			validateBooks(formData, "user-123", mockBooksQueryRepository),
		).rejects.toThrow(InvalidFormatError);
	});
});

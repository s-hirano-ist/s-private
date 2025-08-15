import { describe, expect, test } from "vitest";
import { InvalidFormatError } from "@/common/error/error-classes";
import { BooksDomainService } from "@/domains/books/services/books-domain-service";
import type { IBooksQueryRepository } from "@/domains/books/types";

const mockBooksQueryRepository: IBooksQueryRepository = {
	findByISBN: async () => null,
	findMany: async () => [],
	count: async () => 0,
};

describe("BooksDomainService", () => {
	test("should validate correct books data", async () => {
		const service = new BooksDomainService(mockBooksQueryRepository);
		const formData = new FormData();
		formData.append("isbn", "978-4-06-519981-0");
		formData.append("title", "Sample Book Title");

		const result = await service.prepareNewBook(formData, "user-123");

		expect(result.ISBN).toBe("978-4-06-519981-0");
		expect(result.title).toBe("Sample Book Title");
		expect(result.userId).toBe("user-123");
		expect(result.status).toBe("UNEXPORTED");
	});

	test("should throw InvalidFormatError when ISBN is missing", async () => {
		const service = new BooksDomainService(mockBooksQueryRepository);
		const formData = new FormData();
		formData.append("title", "Sample Book Title");

		await expect(() =>
			service.prepareNewBook(formData, "user-123"),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when ISBN is empty", async () => {
		const service = new BooksDomainService(mockBooksQueryRepository);
		const formData = new FormData();
		formData.append("isbn", "");
		formData.append("title", "Sample Book Title");

		await expect(() =>
			service.prepareNewBook(formData, "user-123"),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when title is missing", async () => {
		const service = new BooksDomainService(mockBooksQueryRepository);
		const formData = new FormData();
		formData.append("isbn", "978-4-06-519981-0");

		await expect(() =>
			service.prepareNewBook(formData, "user-123"),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when title is empty", async () => {
		const service = new BooksDomainService(mockBooksQueryRepository);
		const formData = new FormData();
		formData.append("isbn", "978-4-06-519981-0");
		formData.append("title", "");

		await expect(() =>
			service.prepareNewBook(formData, "user-123"),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when ISBN has invalid format", async () => {
		const service = new BooksDomainService(mockBooksQueryRepository);
		const formData = new FormData();
		formData.append("isbn", "ABC-123-DEF");
		formData.append("title", "Sample Book Title");

		await expect(() =>
			service.prepareNewBook(formData, "user-123"),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when ISBN exceeds max length", async () => {
		const service = new BooksDomainService(mockBooksQueryRepository);
		const formData = new FormData();
		formData.append("isbn", "1".repeat(18));
		formData.append("title", "Sample Book Title");

		await expect(() =>
			service.prepareNewBook(formData, "user-123"),
		).rejects.toThrow(InvalidFormatError);
	});

	test("should throw InvalidFormatError when title exceeds max length", async () => {
		const service = new BooksDomainService(mockBooksQueryRepository);
		const formData = new FormData();
		formData.append("isbn", "978-4-06-519981-0");
		formData.append("title", "a".repeat(257));

		await expect(() =>
			service.prepareNewBook(formData, "user-123"),
		).rejects.toThrow(InvalidFormatError);
	});
});

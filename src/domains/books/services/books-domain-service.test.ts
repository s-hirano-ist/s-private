import { describe, expect, test } from "vitest";
import { DuplicateError } from "@/common/error/error-classes";
import { BooksDomainService } from "@/domains/books/services/books-domain-service";
import { BookEntity } from "@/domains/books/entities/book.entity";
import type { IBooksQueryRepository } from "@/domains/books/types";

const mockBooksQueryRepository: IBooksQueryRepository = {
	findByISBN: async () => null,
	findMany: async () => [],
	count: async () => 0,
};

describe("BooksDomainService", () => {
	test("should create valid book entity", async () => {
		const service = new BooksDomainService(mockBooksQueryRepository);

		const result = await service.validateAndCreateBook({
			isbn: "978-4-06-519981-0",
			title: "Sample Book Title",
			userId: "user-123",
		});

		expect(result).toBeInstanceOf(BookEntity);
		expect(result.getISBN().toString()).toBe("978-4-06-519981-0");
		expect(result.getTitle().toString()).toBe("Sample Book Title");
		expect(result.getUserId()).toBe("user-123");
		expect(result.getStatus()).toBe("UNEXPORTED");
	});

	test("should throw Error when ISBN is invalid", async () => {
		const service = new BooksDomainService(mockBooksQueryRepository);

		await expect(service.validateAndCreateBook({
			isbn: "invalid-isbn",
			title: "Sample Book Title",
			userId: "user-123",
		})).rejects.toThrow("Invalid ISBN format");
	});

	test("should throw Error when title is invalid", async () => {
		const service = new BooksDomainService(mockBooksQueryRepository);

		await expect(service.validateAndCreateBook({
			isbn: "978-4-06-519981-0",
			title: "", // Empty title
			userId: "user-123",
		})).rejects.toThrow("Invalid title");
	});

	test("should throw DuplicateError when book with same ISBN already exists", async () => {
		const mockEntity = BookEntity.create({
			id: "test-id",
			ISBN: "978-4-06-519981-0",
			title: "Existing Book",
			userId: "user-123",
			status: "UNEXPORTED",
			googleTitle: null,
			googleSubTitle: null,
			googleAuthors: null,
			googleDescription: null,
			googleImgSrc: null,
			googleHref: null,
			markdown: null,
		});

		const mockRepository: IBooksQueryRepository = {
			findByISBN: async () => mockEntity,
			findMany: async () => [],
			count: async () => 0,
		};
		const service = new BooksDomainService(mockRepository);

		await expect(service.validateAndCreateBook({
			isbn: "978-4-06-519981-0",
			title: "Sample Book Title",
			userId: "user-123",
		})).rejects.toThrow(DuplicateError);
	});
});
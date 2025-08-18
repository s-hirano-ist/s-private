import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import {
	bookEntity,
	makeBookTitle,
	makeISBN,
} from "@/domains/books/entities/books-entity";
import { makeUserId } from "@/domains/common/entities/common-entity";

describe("booksEntity", () => {
	describe("makeISBN", () => {
		test("should create valid ISBN", () => {
			const isbn = makeISBN("978-4-123-45678-9");
			expect(isbn).toBe("978-4-123-45678-9");
		});

		test("should accept ISBN without hyphens", () => {
			const isbn = makeISBN("9784123456789");
			expect(isbn).toBe("9784123456789");
		});

		test("should throw error for empty string", () => {
			expect(() => makeISBN("")).toThrow(ZodError);
		});

		test("should throw error for too long string", () => {
			expect(() => makeISBN("978-4-123-45678-90-extra")).toThrow(ZodError);
		});

		test("should throw error for invalid characters", () => {
			expect(() => makeISBN("978-4-ABC-45678-9")).toThrow(ZodError);
		});
	});

	describe("makeBookTitle", () => {
		test("should create valid book title", () => {
			const title = makeBookTitle("Clean Code");
			expect(title).toBe("Clean Code");
		});

		test("should throw error for empty string", () => {
			expect(() => makeBookTitle("")).toThrow(ZodError);
		});

		test("should throw error for too long title", () => {
			const longTitle = "a".repeat(257);
			expect(() => makeBookTitle(longTitle)).toThrow(ZodError);
		});
	});

	describe("bookEntity.create", () => {
		test("should create book with valid arguments", () => {
			const book = bookEntity.create({
				userId: makeUserId("test-user-id"),
				ISBN: makeISBN("9784123456789"),
				title: makeBookTitle("Clean Code"),
			});

			expect(book.userId).toBe("test-user-id");
			expect(book.ISBN).toBe("9784123456789");
			expect(book.title).toBe("Clean Code");
			expect(book.status).toBe("UNEXPORTED");
			expect(book.id).toBeDefined();
		});

		test("should create book with UNEXPORTED status by default", () => {
			const book = bookEntity.create({
				userId: makeUserId("test-user-id"),
				ISBN: makeISBN("9784123456789"),
				title: makeBookTitle("Test Book"),
			});

			expect(book.status).toBe("UNEXPORTED");
		});

		test("should be frozen object", () => {
			const book = bookEntity.create({
				userId: makeUserId("test-user-id"),
				ISBN: makeISBN("9784123456789"),
				title: makeBookTitle("Test Book"),
			});

			expect(Object.isFrozen(book)).toBe(true);
		});
	});
});

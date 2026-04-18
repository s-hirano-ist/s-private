import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { makeUserId } from "../../shared-kernel/entities/common-entity.ts";
import {
	bookEntity,
	makeBookMarkdown,
	makeBookTitle,
	makeGoogleAuthors,
	makeGoogleDescription,
	makeGoogleHref,
	makeGoogleImgSrc,
	makeGoogleSubTitle,
	makeGoogleTitle,
	makeISBN,
	makeRating,
	makeTags,
} from "../entities/book-entity.ts";

describe("booksEntity", () => {
	describe("makeISBN", () => {
		test("should normalize ISBN with hyphens to 13 digits", () => {
			const isbn = makeISBN("978-4-123-45678-9");
			expect(isbn).toBe("9784123456789");
		});

		test("should accept ISBN without hyphens", () => {
			const isbn = makeISBN("9784123456789");
			expect(isbn).toBe("9784123456789");
		});

		test("should throw error for empty string", () => {
			expect(() => makeISBN("")).toThrow(ZodError);
		});

		test("should throw error when fewer than 13 digits after stripping hyphens", () => {
			expect(() => makeISBN("978-4-12-3456")).toThrow(ZodError);
		});

		test("should throw error when more than 13 digits after stripping hyphens", () => {
			expect(() => makeISBN("97841234567890")).toThrow(ZodError);
		});

		test("should throw error for ISBN-10 input", () => {
			expect(() => makeISBN("4-06-521234-X")).toThrow(ZodError);
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

	describe("makeRating", () => {
		test("should accept 1 as lower bound", () => {
			expect(makeRating(1)).toBe(1);
		});

		test("should accept 5 as upper bound", () => {
			expect(makeRating(5)).toBe(5);
		});

		test("should throw for 0", () => {
			expect(() => makeRating(0)).toThrow(ZodError);
		});

		test("should throw for 6", () => {
			expect(() => makeRating(6)).toThrow(ZodError);
		});

		test("should throw for non-integer", () => {
			expect(() => makeRating(3.5)).toThrow(ZodError);
		});
	});

	describe("makeTags", () => {
		test("should accept empty array", () => {
			expect(makeTags([])).toEqual([]);
		});

		test("should accept array of strings", () => {
			expect(makeTags(["a", "b"])).toEqual(["a", "b"]);
		});

		test("should throw for empty string element", () => {
			expect(() => makeTags([""])).toThrow(ZodError);
		});

		test("should throw for too long tag", () => {
			expect(() => makeTags(["a".repeat(65)])).toThrow(ZodError);
		});
	});

	describe("bookEntity.create", () => {
		test("should create book with valid arguments", () => {
			const [book, event] = bookEntity.create({
				userId: makeUserId("test-user-id"),
				isbn: makeISBN("9784123456789"),
				title: makeBookTitle("Clean Code"),
				rating: makeRating(5),
				tags: makeTags(["programming"]),
				caller: "test",
			});

			expect(book.userId).toBe("test-user-id");
			expect(book.isbn).toBe("9784123456789");
			expect(book.title).toBe("Clean Code");
			expect(book.rating).toBe(5);
			expect(book.tags).toEqual(["programming"]);
			expect(book.status).toBe("UNEXPORTED");
			expect(book.id).toBeDefined();
			expect(book.imagePath).toBeUndefined();
			expect(event.eventType).toBe("book.created");
		});

		test("should create book with UNEXPORTED status by default", () => {
			const [book] = bookEntity.create({
				userId: makeUserId("test-user-id"),
				isbn: makeISBN("9784123456789"),
				title: makeBookTitle("Test Book"),
				rating: makeRating(3),
				tags: makeTags([]),
				caller: "test",
			});

			expect(book.status).toBe("UNEXPORTED");
		});

		test("should be frozen object", () => {
			const [book] = bookEntity.create({
				userId: makeUserId("test-user-id"),
				isbn: makeISBN("9784123456789"),
				title: makeBookTitle("Test Book"),
				rating: makeRating(3),
				tags: makeTags([]),
				caller: "test",
			});

			expect(Object.isFrozen(book)).toBe(true);
		});
	});

	describe("Google-related factory functions", () => {
		test("makeGoogleTitle should create GoogleTitle", () => {
			const googleTitle = makeGoogleTitle("Google Book Title");
			expect(googleTitle).toBe("Google Book Title");
		});

		test("makeGoogleTitle should handle null value", () => {
			const googleTitle = makeGoogleTitle(null);
			expect(googleTitle).toBeNull();
		});

		test("makeGoogleSubTitle should create GoogleSubTitle", () => {
			const googleSubTitle = makeGoogleSubTitle("Subtitle from Google");
			expect(googleSubTitle).toBe("Subtitle from Google");
		});

		test("makeGoogleSubTitle should handle null value", () => {
			const googleSubTitle = makeGoogleSubTitle(null);
			expect(googleSubTitle).toBeNull();
		});

		test("makeGoogleAuthors should create GoogleAuthors", () => {
			const authors = ["Author 1", "Author 2"];
			const googleAuthors = makeGoogleAuthors(authors);
			expect(googleAuthors).toEqual(authors);
		});

		test("makeGoogleAuthors should handle null value", () => {
			const googleAuthors = makeGoogleAuthors(null);
			expect(googleAuthors).toBeNull();
		});

		test("makeGoogleDescription should create GoogleDescription", () => {
			const description = "This is a book description from Google Books API";
			const googleDescription = makeGoogleDescription(description);
			expect(googleDescription).toBe(description);
		});

		test("makeGoogleDescription should handle null value", () => {
			const googleDescription = makeGoogleDescription(null);
			expect(googleDescription).toBeNull();
		});

		test("makeGoogleImgSrc should create GoogleImgSrc", () => {
			const imgSrc = "https://books.google.com/books/content/images/cover.jpg";
			const googleImgSrc = makeGoogleImgSrc(imgSrc);
			expect(googleImgSrc).toBe(imgSrc);
		});

		test("makeGoogleImgSrc should create GoogleImgSrc with HTTP URL", () => {
			const imgSrc = "http://books.google.com/books/content/images/cover.jpg";
			const googleImgSrc = makeGoogleImgSrc(imgSrc);
			expect(googleImgSrc).toBe(imgSrc);
		});

		test("makeGoogleImgSrc should handle null value", () => {
			const googleImgSrc = makeGoogleImgSrc(null);
			expect(googleImgSrc).toBeNull();
		});

		test("makeGoogleImgSrc should throw error for non-HTTP protocol", () => {
			expect(() => makeGoogleImgSrc("ftp://example.com/image.jpg")).toThrow(
				ZodError,
			);
		});

		test("makeGoogleImgSrc should throw error for data URL", () => {
			expect(() =>
				makeGoogleImgSrc("data:image/png;base64,iVBORw0KGgo="),
			).toThrow(ZodError);
		});

		test("makeGoogleImgSrc should throw error for invalid URL format", () => {
			expect(() => makeGoogleImgSrc("not-a-url")).toThrow(ZodError);
		});

		test("makeGoogleHref should create GoogleHref", () => {
			const href = "https://books.google.com/books?id=example";
			const googleHref = makeGoogleHref(href);
			expect(googleHref).toBe(href);
		});

		test("makeGoogleHref should create GoogleHref with HTTP URL", () => {
			const href = "http://books.google.com/books?id=example";
			const googleHref = makeGoogleHref(href);
			expect(googleHref).toBe(href);
		});

		test("makeGoogleHref should handle null value", () => {
			const googleHref = makeGoogleHref(null);
			expect(googleHref).toBeNull();
		});

		test("makeGoogleHref should throw error for non-HTTP protocol", () => {
			expect(() => makeGoogleHref("ftp://books.google.com/books")).toThrow(
				ZodError,
			);
		});

		test("makeGoogleHref should throw error for javascript URL", () => {
			expect(() => makeGoogleHref("javascript:alert('XSS')")).toThrow(ZodError);
		});

		test("makeGoogleHref should throw error for invalid URL format", () => {
			expect(() => makeGoogleHref("not-a-url")).toThrow(ZodError);
		});

		test("makeBookMarkdown should create BookMarkdown", () => {
			const markdown = "# Book Review\n\nThis is a great book.";
			const bookMarkdown = makeBookMarkdown(markdown);
			expect(bookMarkdown).toBe(markdown);
		});

		test("makeBookMarkdown should handle null value", () => {
			const bookMarkdown = makeBookMarkdown(null);
			expect(bookMarkdown).toBeNull();
		});
	});
});

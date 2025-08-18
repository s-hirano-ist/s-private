import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import {
	InvalidFormatError,
	UnexpectedError,
} from "@/common/error/error-classes";
import { makeUserId } from "@/domains/common/entities/common-entity";
import {
	makeCategoryName,
	makeNewsTitle,
	makeOgDescription,
	makeOgTitle,
	makeQuote,
	makeUrl,
	newsEntity,
} from "@/domains/news/entities/news-entity";

describe("newsEntity", () => {
	describe("makeCategoryName", () => {
		test("should create valid category name", () => {
			const category = makeCategoryName("Tech");
			expect(category).toBe("Tech");
		});

		test("should trim whitespace", () => {
			const category = makeCategoryName("  Science  ");
			expect(category).toBe("Science");
		});

		test("should throw error for empty string", () => {
			expect(() => makeCategoryName("")).toThrow(ZodError);
		});

		test("should throw error for too long name", () => {
			expect(() => makeCategoryName("a".repeat(17))).toThrow(ZodError);
		});
	});

	describe("makeNewsTitle", () => {
		test("should create valid news title", () => {
			const title = makeNewsTitle("Breaking News");
			expect(title).toBe("Breaking News");
		});

		test("should throw error for empty string", () => {
			expect(() => makeNewsTitle("")).toThrow(ZodError);
		});

		test("should throw error for too long title", () => {
			expect(() => makeNewsTitle("a".repeat(65))).toThrow(ZodError);
		});
	});

	describe("makeQuote", () => {
		test("should create quote with string", () => {
			const quote = makeQuote("This is a quote");
			expect(quote).toBe("This is a quote");
		});

		test("should accept null", () => {
			const quote = makeQuote(null);
			expect(quote).toBeNull();
		});

		test("should accept undefined", () => {
			const quote = makeQuote(undefined);
			expect(quote).toBeUndefined();
		});

		test("should throw error for too long quote", () => {
			expect(() => makeQuote("a".repeat(257))).toThrow(ZodError);
		});
	});

	describe("makeUrl", () => {
		test("should create valid HTTP URL", () => {
			const url = makeUrl("http://example.com");
			expect(url).toBe("http://example.com");
		});

		test("should create valid HTTPS URL", () => {
			const url = makeUrl("https://example.com");
			expect(url).toBe("https://example.com");
		});

		test("should throw error for invalid URL", () => {
			expect(() => makeUrl("not-a-url")).toThrow(ZodError);
		});

		test("should throw error for non-HTTP protocol", () => {
			expect(() => makeUrl("ftp://example.com")).toThrow(ZodError);
		});

		test("should throw error for empty string", () => {
			expect(() => makeUrl("")).toThrow(ZodError);
		});
	});

	describe("makeOgTitle", () => {
		test("should create og title with string", () => {
			const title = makeOgTitle("OG Title");
			expect(title).toBe("OG Title");
		});

		test("should accept null", () => {
			const title = makeOgTitle(null);
			expect(title).toBeNull();
		});

		test("should accept undefined", () => {
			const title = makeOgTitle(undefined);
			expect(title).toBeUndefined();
		});
	});

	describe("makeOgDescription", () => {
		test("should create og description with string", () => {
			const desc = makeOgDescription("OG Description");
			expect(desc).toBe("OG Description");
		});

		test("should accept null", () => {
			const desc = makeOgDescription(null);
			expect(desc).toBeNull();
		});

		test("should accept undefined", () => {
			const desc = makeOgDescription(undefined);
			expect(desc).toBeUndefined();
		});
	});

	describe("newsEntity.create", () => {
		test("should create news with valid arguments", () => {
			const news = newsEntity.create({
				userId: makeUserId("test-user-id"),
				categoryName: makeCategoryName("Tech"),
				title: makeNewsTitle("Breaking News"),
				url: makeUrl("https://example.com"),
			});

			expect(news.userId).toBe("test-user-id");
			expect(news.categoryName).toBe("Tech");
			expect(news.title).toBe("Breaking News");
			expect(news.url).toBe("https://example.com");
			expect(news.status).toBe("UNEXPORTED");
			expect(news.id).toBeDefined();
			expect(news.categoryId).toBeDefined();
		});

		test("should create news with optional quote", () => {
			const news = newsEntity.create({
				userId: makeUserId("test-user-id"),
				categoryName: makeCategoryName("Science"),
				title: makeNewsTitle("Science News"),
				quote: makeQuote("This is a quote"),
				url: makeUrl("https://science.com"),
			});

			expect(news.quote).toBe("This is a quote");
		});

		test("should create news with UNEXPORTED status by default", () => {
			const news = newsEntity.create({
				userId: makeUserId("test-user-id"),
				categoryName: makeCategoryName("Tech"),
				title: makeNewsTitle("Test News"),
				url: makeUrl("https://example.com"),
			});

			expect(news.status).toBe("UNEXPORTED");
		});

		test("should be frozen object", () => {
			const news = newsEntity.create({
				userId: makeUserId("test-user-id"),
				categoryName: makeCategoryName("Tech"),
				title: makeNewsTitle("Test News"),
				url: makeUrl("https://example.com"),
			});

			expect(Object.isFrozen(news)).toBe(true);
		});

		test("should generate IDs for news and category", () => {
			const news = newsEntity.create({
				userId: makeUserId("test-user-id"),
				categoryName: makeCategoryName("Tech"),
				title: makeNewsTitle("Test News"),
				url: makeUrl("https://example.com"),
			});

			expect(news.id).toBeDefined();
			expect(news.categoryId).toBeDefined();
			expect(typeof news.id).toBe("string");
			expect(typeof news.categoryId).toBe("string");
			expect(news.id.length).toBeGreaterThan(0);
			expect(news.categoryId.length).toBeGreaterThan(0);
		});
	});
});

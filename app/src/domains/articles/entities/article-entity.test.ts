import { describe, expect, test, vi } from "vitest";
import { ZodError } from "zod";
import {
	InvalidFormatError,
	UnexpectedError,
} from "@/common/error/error-classes";
import {
	articleEntity,
	makeArticleTitle,
	makeCategoryName,
	makeOgDescription,
	makeOgTitle,
	makeQuote,
	makeUrl,
} from "@/domains/articles/entities/article-entity";
import { makeUserId } from "@/domains/common/entities/common-entity";
import * as entityFactory from "@/domains/common/services/entity-factory";

describe("articleEntity", () => {
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

	describe("makeArticleTitle", () => {
		test("should create valid article title", () => {
			const title = makeArticleTitle("Breaking article");
			expect(title).toBe("Breaking article");
		});

		test("should throw error for empty string", () => {
			expect(() => makeArticleTitle("")).toThrow(ZodError);
		});

		test("should throw error for too long title", () => {
			expect(() => makeArticleTitle("a".repeat(129))).toThrow(ZodError);
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
			expect(() => makeQuote("a".repeat(513))).toThrow(ZodError);
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

	describe("articleEntity.create", () => {
		test("should create article with valid arguments", () => {
			const article = articleEntity.create({
				userId: makeUserId("test-user-id"),
				categoryName: makeCategoryName("Tech"),
				title: makeArticleTitle("Breaking article"),
				url: makeUrl("https://example.com"),
			});

			expect(article.userId).toBe("test-user-id");
			expect(article.categoryName).toBe("Tech");
			expect(article.title).toBe("Breaking article");
			expect(article.url).toBe("https://example.com");
			expect(article.status).toBe("UNEXPORTED");
			expect(article.id).toBeDefined();
			expect(article.categoryId).toBeDefined();
		});

		test("should create article with optional quote", () => {
			const article = articleEntity.create({
				userId: makeUserId("test-user-id"),
				categoryName: makeCategoryName("Science"),
				title: makeArticleTitle("Science article"),
				quote: makeQuote("This is a quote"),
				url: makeUrl("https://science.com"),
			});

			expect(article.quote).toBe("This is a quote");
		});

		test("should create article with UNEXPORTED status by default", () => {
			const article = articleEntity.create({
				userId: makeUserId("test-user-id"),
				categoryName: makeCategoryName("Tech"),
				title: makeArticleTitle("Test article"),
				url: makeUrl("https://example.com"),
			});

			expect(article.status).toBe("UNEXPORTED");
		});

		test("should be frozen object", () => {
			const article = articleEntity.create({
				userId: makeUserId("test-user-id"),
				categoryName: makeCategoryName("Tech"),
				title: makeArticleTitle("Test article"),
				url: makeUrl("https://example.com"),
			});

			expect(Object.isFrozen(article)).toBe(true);
		});

		test("should generate IDs for article and category", () => {
			const article = articleEntity.create({
				userId: makeUserId("test-user-id"),
				categoryName: makeCategoryName("Tech"),
				title: makeArticleTitle("Test article"),
				url: makeUrl("https://example.com"),
			});

			expect(article.id).toBeDefined();
			expect(article.categoryId).toBeDefined();
			expect(typeof article.id).toBe("string");
			expect(typeof article.categoryId).toBe("string");
			expect(article.id.length).toBeGreaterThan(0);
			expect(article.categoryId.length).toBeGreaterThan(0);
		});

		test("should use createEntityWithErrorHandling for exception handling", () => {
			const createEntityWithErrorHandlingSpy = vi.spyOn(
				entityFactory,
				"createEntityWithErrorHandling",
			);

			articleEntity.create({
				userId: makeUserId("test-user-id"),
				categoryName: makeCategoryName("Tech"),
				title: makeArticleTitle("Test article"),
				url: makeUrl("https://example.com"),
			});

			expect(createEntityWithErrorHandlingSpy).toHaveBeenCalledTimes(1);
			expect(createEntityWithErrorHandlingSpy).toHaveBeenCalledWith(
				expect.any(Function),
			);

			createEntityWithErrorHandlingSpy.mockRestore();
		});

		test("should throw InvalidFormatError when validation fails", () => {
			const createEntityWithErrorHandlingSpy = vi
				.spyOn(entityFactory, "createEntityWithErrorHandling")
				.mockImplementation(() => {
					throw new InvalidFormatError();
				});

			expect(() =>
				articleEntity.create({
					userId: makeUserId("test-user-id"),
					categoryName: makeCategoryName("Tech"),
					title: makeArticleTitle("Test article"),
					url: makeUrl("https://example.com"),
				}),
			).toThrow(InvalidFormatError);

			createEntityWithErrorHandlingSpy.mockRestore();
		});

		test("should throw UnexpectedError when unexpected error occurs", () => {
			const createEntityWithErrorHandlingSpy = vi
				.spyOn(entityFactory, "createEntityWithErrorHandling")
				.mockImplementation(() => {
					throw new UnexpectedError();
				});

			expect(() =>
				articleEntity.create({
					userId: makeUserId("test-user-id"),
					categoryName: makeCategoryName("Tech"),
					title: makeArticleTitle("Test article"),
					url: makeUrl("https://example.com"),
				}),
			).toThrow(UnexpectedError);

			createEntityWithErrorHandlingSpy.mockRestore();
		});
	});
});

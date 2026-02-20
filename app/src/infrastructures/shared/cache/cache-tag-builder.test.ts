import { describe, expect, test } from "vitest";
import {
	buildCategoriesCacheTag,
	buildContentCacheTag,
	buildCountCacheTag,
	buildPaginatedContentCacheTag,
} from "./cache-tag-builder";

describe("cache-tag-builder", () => {
	describe("buildContentCacheTag", () => {
		test("should build tag in format domain_status_sanitizedUserId", () => {
			const tag = buildContentCacheTag("articles", "UNEXPORTED", "user_abc");
			expect(tag).toBe("articles_UNEXPORTED_user_abc");
		});

		test("should sanitize userId (remove non-alpha and non-underscore chars)", () => {
			const tag = buildContentCacheTag(
				"books",
				"EXPORTED",
				"user-123@test.com",
			);
			expect(tag).toBe("books_EXPORTED_usertestcom");
		});

		test("should work with all domain types", () => {
			expect(buildContentCacheTag("articles", "UNEXPORTED", "u")).toBe(
				"articles_UNEXPORTED_u",
			);
			expect(buildContentCacheTag("books", "UNEXPORTED", "u")).toBe(
				"books_UNEXPORTED_u",
			);
			expect(buildContentCacheTag("notes", "UNEXPORTED", "u")).toBe(
				"notes_UNEXPORTED_u",
			);
			expect(buildContentCacheTag("images", "UNEXPORTED", "u")).toBe(
				"images_UNEXPORTED_u",
			);
		});
	});

	describe("buildCountCacheTag", () => {
		test("should build tag in format domain_count_status_sanitizedUserId", () => {
			const tag = buildCountCacheTag("articles", "UNEXPORTED", "user_abc");
			expect(tag).toBe("articles_count_UNEXPORTED_user_abc");
		});

		test("should sanitize userId", () => {
			const tag = buildCountCacheTag("notes", "EXPORTED", "user-123");
			expect(tag).toBe("notes_count_EXPORTED_user");
		});
	});

	describe("buildPaginatedContentCacheTag", () => {
		test("should build tag with currentCount", () => {
			const tag = buildPaginatedContentCacheTag(
				"articles",
				"UNEXPORTED",
				"user_abc",
				10,
			);
			expect(tag).toBe("articles_UNEXPORTED_user_abc_10");
		});

		test("should handle zero currentCount", () => {
			const tag = buildPaginatedContentCacheTag(
				"books",
				"EXPORTED",
				"user_abc",
				0,
			);
			expect(tag).toBe("books_EXPORTED_user_abc_0");
		});

		test("should sanitize userId", () => {
			const tag = buildPaginatedContentCacheTag(
				"notes",
				"UNEXPORTED",
				"user@123",
				5,
			);
			expect(tag).toBe("notes_UNEXPORTED_user_5");
		});
	});

	describe("buildCategoriesCacheTag", () => {
		test("should build tag in format categories_sanitizedUserId", () => {
			const tag = buildCategoriesCacheTag("user_abc");
			expect(tag).toBe("categories_user_abc");
		});

		test("should sanitize userId", () => {
			const tag = buildCategoriesCacheTag("user-123@test.com");
			expect(tag).toBe("categories_usertestcom");
		});
	});
});

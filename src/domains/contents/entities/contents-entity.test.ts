import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { makeUserId } from "@/domains/common/entities/common-entity";
import {
	contentEntity,
	makeContentTitle,
	makeMarkdown,
} from "@/domains/contents/entities/contents-entity";

describe("contentsEntity", () => {
	describe("makeContentTitle", () => {
		test("should create valid content title", () => {
			const title = makeContentTitle("My Article");
			expect(title).toBe("My Article");
		});

		test("should throw error for empty string", () => {
			expect(() => makeContentTitle("")).toThrow(ZodError);
		});

		test("should throw error for too long title", () => {
			expect(() => makeContentTitle("a".repeat(65))).toThrow(ZodError);
		});
	});

	describe("makeMarkdown", () => {
		test("should create valid markdown", () => {
			const markdown = makeMarkdown("# Hello World");
			expect(markdown).toBe("# Hello World");
		});

		test("should throw error for empty string", () => {
			expect(() => makeMarkdown("")).toThrow(ZodError);
		});
	});

	describe("contentEntity.create", () => {
		test("should create content with valid arguments", () => {
			const content = contentEntity.create({
				userId: makeUserId("test-user-id"),
				title: makeContentTitle("My Article"),
				markdown: makeMarkdown("# Hello World\n\nThis is my article."),
			});

			expect(content.userId).toBe("test-user-id");
			expect(content.title).toBe("My Article");
			expect(content.markdown).toBe("# Hello World\n\nThis is my article.");
			expect(content.status).toBe("UNEXPORTED");
			expect(content.id).toBeDefined();
		});

		test("should create content with UNEXPORTED status by default", () => {
			const content = contentEntity.create({
				userId: makeUserId("test-user-id"),
				title: makeContentTitle("Test Article"),
				markdown: makeMarkdown("Content here"),
			});

			expect(content.status).toBe("UNEXPORTED");
		});

		test("should be frozen object", () => {
			const content = contentEntity.create({
				userId: makeUserId("test-user-id"),
				title: makeContentTitle("Test Article"),
				markdown: makeMarkdown("Content here"),
			});

			expect(Object.isFrozen(content)).toBe(true);
		});
	});
});

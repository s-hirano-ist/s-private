import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { makeContentType, makeFileSize, makePath } from "./file-entity";

describe("file-entity", () => {
	describe("makePath", () => {
		test("should create valid path without sanitization", () => {
			const path = makePath("existing-path.jpg", false);
			expect(path).toBe("existing-path.jpg");
		});

		test("should throw error for empty string", () => {
			expect(() => makePath("", false)).toThrow(ZodError);
		});

		test("should throw error for path exceeding 512 characters", () => {
			expect(() => makePath("a".repeat(513), false)).toThrow(ZodError);
		});

		test("should sanitize and prepend UUID when sanitizeAndUnique is true", () => {
			const path = makePath("my image.jpg", true);
			expect(path).toContain("myimage.jpg");
			// UUID v7 format: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
			expect(path).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}-myimage\.jpg$/,
			);
		});

		test("should remove special characters when sanitizing", () => {
			const path = makePath("日本語ファイル名!@#$.png", true);
			expect(path).toContain(".png");
			expect(path).not.toContain("日");
			expect(path).not.toContain("!");
			expect(path).not.toContain("@");
			expect(path).not.toContain("#");
			expect(path).not.toContain("$");
		});

		test("should accept maximum length path", () => {
			const path = makePath("a".repeat(512), false);
			expect(path).toBe("a".repeat(512));
		});
	});

	describe("makeContentType", () => {
		test("should accept image/jpeg", () => {
			expect(makeContentType("image/jpeg")).toBe("image/jpeg");
		});

		test("should accept image/png", () => {
			expect(makeContentType("image/png")).toBe("image/png");
		});

		test("should accept image/gif", () => {
			expect(makeContentType("image/gif")).toBe("image/gif");
		});

		test("should accept jpeg", () => {
			expect(makeContentType("jpeg")).toBe("jpeg");
		});

		test("should accept png", () => {
			expect(makeContentType("png")).toBe("png");
		});

		test("should throw error for unsupported content type", () => {
			expect(() => makeContentType("image/webp")).toThrow(ZodError);
		});

		test("should throw error for empty string", () => {
			expect(() => makeContentType("")).toThrow(ZodError);
		});

		test("should throw error for arbitrary string", () => {
			expect(() => makeContentType("text/plain")).toThrow(ZodError);
		});
	});

	describe("makeFileSize", () => {
		test("should accept zero", () => {
			expect(makeFileSize(0)).toBe(0);
		});

		test("should accept positive integer", () => {
			expect(makeFileSize(1024)).toBe(1024);
		});

		test("should accept 100MB (upper limit)", () => {
			const size = 100 * 1024 * 1024;
			expect(makeFileSize(size)).toBe(size);
		});

		test("should throw error for negative number", () => {
			expect(() => makeFileSize(-1)).toThrow(ZodError);
		});

		test("should throw error for decimal number", () => {
			expect(() => makeFileSize(1.5)).toThrow(ZodError);
		});

		test("should throw error for exceeding 100MB", () => {
			expect(() => makeFileSize(100 * 1024 * 1024 + 1)).toThrow(ZodError);
		});
	});
});

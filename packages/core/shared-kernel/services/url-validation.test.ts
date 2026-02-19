import { describe, expect, test } from "vitest";
import { isValidHttpUrl } from "./url-validation.ts";

describe("isValidHttpUrl", () => {
	describe("valid HTTP/HTTPS URLs", () => {
		test("should return true for valid HTTPS URL", () => {
			expect(isValidHttpUrl("https://example.com")).toBe(true);
		});

		test("should return true for valid HTTP URL", () => {
			expect(isValidHttpUrl("http://example.com")).toBe(true);
		});

		test("should return true for HTTPS URL with path", () => {
			expect(isValidHttpUrl("https://example.com/path/to/image.jpg")).toBe(
				true,
			);
		});

		test("should return true for HTTPS URL with query parameters", () => {
			expect(isValidHttpUrl("https://example.com/image?size=large")).toBe(true);
		});

		test("should return true for HTTPS URL with port", () => {
			expect(isValidHttpUrl("https://example.com:8080/image.png")).toBe(true);
		});
	});

	describe("invalid protocols", () => {
		test("should return false for FTP URL", () => {
			expect(isValidHttpUrl("ftp://example.com/file.txt")).toBe(false);
		});

		test("should return false for file URL", () => {
			expect(isValidHttpUrl("file:///path/to/file.txt")).toBe(false);
		});

		test("should return false for data URL", () => {
			expect(isValidHttpUrl("data:image/png;base64,iVBORw0KGgo=")).toBe(false);
		});

		test("should return false for javascript URL", () => {
			expect(isValidHttpUrl("javascript:alert('XSS')")).toBe(false);
		});

		test("should return false for mailto URL", () => {
			expect(isValidHttpUrl("mailto:test@example.com")).toBe(false);
		});
	});

	describe("invalid URL formats", () => {
		test("should return false for plain text", () => {
			expect(isValidHttpUrl("not-a-url")).toBe(false);
		});

		test("should return false for URL without protocol", () => {
			expect(isValidHttpUrl("example.com/image.jpg")).toBe(false);
		});

		test("should return false for partial URL", () => {
			expect(isValidHttpUrl("://example.com")).toBe(false);
		});

		test("should return true for empty string (supports nullable fields)", () => {
			expect(isValidHttpUrl("")).toBe(true);
		});
	});
});

import { describe, expect, test } from "vitest";
import {
	isExternalUrl,
	isInternalUrl,
	isValidUrl,
	validateAndNormalizeUrl,
	validateUrl,
} from "./validate-url";

describe("validate-url utils", () => {
	describe("isValidUrl", () => {
		test("should return true for valid HTTP URLs", () => {
			expect(isValidUrl("http://example.com")).toBe(true);
		});

		test("should return true for valid HTTPS URLs", () => {
			expect(isValidUrl("https://example.com")).toBe(true);
		});

		test("should return false for invalid URLs", () => {
			expect(isValidUrl("invalid-url")).toBe(false);
		});

		test("should return false for javascript: URLs", () => {
			expect(isValidUrl("javascript:alert('xss')")).toBe(false);
		});

		test("should return false for data: URLs", () => {
			expect(isValidUrl("data:text/html,<script>alert('xss')</script>")).toBe(
				false,
			);
		});
	});

	describe("isExternalUrl", () => {
		test("should return true for external HTTP/HTTPS URLs", () => {
			expect(isExternalUrl("https://example.com")).toBe(true);
			expect(isExternalUrl("http://example.com")).toBe(true);
		});

		test("should return false for invalid URLs", () => {
			expect(isExternalUrl("invalid-url")).toBe(false);
		});

		test("should return false for javascript: URLs", () => {
			expect(isExternalUrl("javascript:alert('xss')")).toBe(false);
		});
	});

	describe("isInternalUrl", () => {
		test("should return true for internal paths", () => {
			expect(isInternalUrl("/")).toBe(true);
			expect(isInternalUrl("/viewer")).toBe(true);
			expect(isInternalUrl("/viewer/articles")).toBe(true);
		});

		test("should return false for external URLs", () => {
			expect(isInternalUrl("https://example.com")).toBe(false);
		});

		test("should return false for protocol-relative URLs", () => {
			expect(isInternalUrl("//example.com")).toBe(false);
		});

		test("should return false for empty string", () => {
			expect(isInternalUrl("")).toBe(false);
		});
	});

	describe("validateUrl", () => {
		test("should return the URL when it is an HTTP URL", () => {
			const url = "http://example.com";
			const result = validateUrl(url);
			expect(result).toBe(url);
		});

		test("should return the URL when it is an HTTPS URL", () => {
			const url = "https://example.com";
			const result = validateUrl(url);
			expect(result).toBe(url);
		});

		test("should return valid internal URLs as-is", () => {
			expect(validateUrl("/viewer")).toBe("/viewer");
		});

		test("should return '/' for non-HTTP/HTTPS protocols", () => {
			const url = "ftp://example.com";
			const result = validateUrl(url);
			expect(result).toBe("/");
		});

		test("should return '/' for invalid URLs", () => {
			const url = "invalid-url";
			const result = validateUrl(url);
			expect(result).toBe("/");
		});

		test("should return '/' for javascript: URLs", () => {
			expect(validateUrl("javascript:alert('xss')")).toBe("/");
		});
	});

	describe("validateAndNormalizeUrl", () => {
		test("should handle internal URLs", () => {
			const result = validateAndNormalizeUrl("/viewer");
			expect(result).toEqual({
				url: "/viewer",
				isExternal: false,
				isValid: true,
			});
		});

		test("should handle external URLs", () => {
			const result = validateAndNormalizeUrl("https://example.com");
			expect(result).toEqual({
				url: "https://example.com",
				isExternal: true,
				isValid: true,
			});
		});

		test("should handle invalid URLs", () => {
			const result = validateAndNormalizeUrl("javascript:alert('xss')");
			expect(result).toEqual({
				url: "/",
				isExternal: false,
				isValid: false,
			});
		});

		test("should handle empty URLs", () => {
			const result = validateAndNormalizeUrl("");
			expect(result).toEqual({
				url: "/",
				isExternal: false,
				isValid: false,
			});
		});

		test("should handle URLs with non-HTTP(S) protocols", () => {
			const result = validateAndNormalizeUrl("ftp://example.com");
			expect(result).toEqual({
				url: "/",
				isExternal: false,
				isValid: false,
			});
		});

		test("should handle protocol-relative URLs", () => {
			const result = validateAndNormalizeUrl("//example.com");
			expect(result).toEqual({
				url: "/",
				isExternal: false,
				isValid: false,
			});
		});

		test("should handle relative paths without leading slash", () => {
			const result = validateAndNormalizeUrl("path/to/resource");
			expect(result).toEqual({
				url: "/",
				isExternal: false,
				isValid: false,
			});
		});
	});
});

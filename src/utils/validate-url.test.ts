import { describe, expect, it } from "vitest";
import { validateUrl } from "./validate-url";

describe("validateUrl", () => {
	it("should return the URL when it is an HTTP URL", () => {
		const url = "http://example.com";
		const result = validateUrl(url);
		expect(result).toBe(url);
	});

	it("should return the URL when it is an HTTPS URL", () => {
		const url = "https://example.com";
		const result = validateUrl(url);
		expect(result).toBe(url);
	});

	it("should throw an error for non-HTTP/HTTPS protocols", () => {
		const url = "ftp://example.com";
		const result = validateUrl(url);
		expect(result).toBe("/");
	});

	it("should throw an error for invalid URLs", () => {
		const url = "invalid-url";
		const result = validateUrl(url);
		expect(result).toBe("/");
	});
});

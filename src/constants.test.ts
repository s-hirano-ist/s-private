import { describe, expect, it } from "vitest";
import {
	NOT_FOUND_IMAGE_PATH,
	ORIGINAL_IMAGE_PATH,
	PAGE_NAME,
	PAGE_SIZE,
	SKELETON_STACK_SIZE,
	THUMBNAIL_HEIGHT,
	THUMBNAIL_IMAGE_PATH,
	THUMBNAIL_WIDTH,
	UTIL_URLS,
} from "./constants";

describe("constants", () => {
	it("should have correct page configuration values", () => {
		expect(PAGE_NAME).toBe("s-private");
		expect(PAGE_SIZE).toBe(24);
		expect(typeof PAGE_SIZE).toBe("number");
		expect(PAGE_SIZE).toBeGreaterThan(0);
	});

	it("should have correct image path constants", () => {
		expect(ORIGINAL_IMAGE_PATH).toBe("images/original");
		expect(THUMBNAIL_IMAGE_PATH).toBe("images/thumbnail");
		expect(NOT_FOUND_IMAGE_PATH).toBe("/not-found.png");

		// Ensure paths are strings
		expect(typeof ORIGINAL_IMAGE_PATH).toBe("string");
		expect(typeof THUMBNAIL_IMAGE_PATH).toBe("string");
		expect(typeof NOT_FOUND_IMAGE_PATH).toBe("string");
	});

	it("should have correct thumbnail dimensions", () => {
		expect(THUMBNAIL_WIDTH).toBe(192);
		expect(THUMBNAIL_HEIGHT).toBe(192);
		expect(typeof THUMBNAIL_WIDTH).toBe("number");
		expect(typeof THUMBNAIL_HEIGHT).toBe("number");
		expect(THUMBNAIL_WIDTH).toBeGreaterThan(0);
		expect(THUMBNAIL_HEIGHT).toBeGreaterThan(0);
	});

	it("should have correct skeleton stack size", () => {
		expect(SKELETON_STACK_SIZE).toBe(10);
		expect(typeof SKELETON_STACK_SIZE).toBe("number");
		expect(SKELETON_STACK_SIZE).toBeGreaterThan(0);
	});

	it("should have valid util URLs array", () => {
		expect(Array.isArray(UTIL_URLS)).toBe(true);
		expect(UTIL_URLS.length).toBeGreaterThan(0);

		// Check structure of each URL object
		UTIL_URLS.forEach((urlObj, index) => {
			expect(urlObj).toHaveProperty("name");
			expect(urlObj).toHaveProperty("url");
			expect(typeof urlObj.name).toBe("string");
			expect(typeof urlObj.url).toBe("string");
			expect(urlObj.name.length).toBeGreaterThan(0);
			expect(urlObj.url.length).toBeGreaterThan(0);
			expect(urlObj.url).toMatch(/^https?:\/\//);
		});
	});

	it("should have expected util URL entries", () => {
		const expectedNames = [
			"NEWS",
			"SUMMARY",
			"BOOK",
			"BLOG",
			"PORTAINER",
			"GRAFANA",
			"STORYBOOK",
			"ZENN",
		];
		const actualNames = UTIL_URLS.map((url) => url.name);

		expectedNames.forEach((name) => {
			expect(actualNames).toContain(name);
		});

		expect(UTIL_URLS.length).toBe(8);
	});

	it("should have valid URL formats", () => {
		UTIL_URLS.forEach((urlObj) => {
			expect(() => new URL(urlObj.url)).not.toThrow();
		});
	});

	it("should have specific URL entries with correct domains", () => {
		const newsUrl = UTIL_URLS.find((url) => url.name === "NEWS");
		expect(newsUrl?.url).toBe("https://s-hirano.com/news");

		const portainerUrl = UTIL_URLS.find((url) => url.name === "PORTAINER");
		expect(portainerUrl?.url).toBe("https://s-tools.s-hirano.com:9443");

		const zennUrl = UTIL_URLS.find((url) => url.name === "ZENN");
		expect(zennUrl?.url).toBe("https://zenn.dev/s_hirano_ist");
	});

	it("should ensure constants are immutable values", () => {
		// Test that constants are the correct primitive types
		expect(typeof PAGE_NAME).toBe("string");
		expect(typeof PAGE_SIZE).toBe("number");
		expect(typeof ORIGINAL_IMAGE_PATH).toBe("string");
		expect(typeof THUMBNAIL_IMAGE_PATH).toBe("string");
		expect(typeof THUMBNAIL_WIDTH).toBe("number");
		expect(typeof THUMBNAIL_HEIGHT).toBe("number");
		expect(typeof NOT_FOUND_IMAGE_PATH).toBe("string");
		expect(typeof SKELETON_STACK_SIZE).toBe("number");
	});
});

import { describe, expect } from "vitest";
import manifest from "./manifest";

describe("manifest", () => {
	test("should return a valid web app manifest", () => {
		const result = manifest();

		expect(result).toBeDefined();
		expect(typeof result).toBe("object");
	});

	test("should have correct app name and short name", () => {
		const result = manifest();

		expect(result.name).toBe("s-private");
		expect(result.short_name).toBe("s-private");
	});

	test("should have correct description", () => {
		const result = manifest();

		expect(result.description).toBe(
			"Dumper and Viewer of s-hirano-ist's memories.",
		);
	});

	test("should have correct language and start URL", () => {
		const result = manifest();

		expect(result.lang).toBe("ja");
		expect(result.start_url).toBe("/");
	});

	test("should have correct theme and background colors", () => {
		const result = manifest();

		expect(result.theme_color).toBe("#fff");
		expect(result.background_color).toBe("#000");
	});

	test("should have correct display mode", () => {
		const result = manifest();

		expect(result.display).toBe("fullscreen");
	});

	test("should have favicon icon configuration", () => {
		const result = manifest();

		expect(Array.isArray(result.icons)).toBe(true);
		expect(result.icons).toHaveLength(1);
		expect(result.icons[0]).toEqual({
			src: "/favicon.ico",
			sizes: "any",
		});
	});

	test("should have all required manifest properties", () => {
		const result = manifest();

		expect(result).toHaveProperty("name");
		expect(result).toHaveProperty("short_name");
		expect(result).toHaveProperty("description");
		expect(result).toHaveProperty("lang");
		expect(result).toHaveProperty("start_url");
		expect(result).toHaveProperty("theme_color");
		expect(result).toHaveProperty("background_color");
		expect(result).toHaveProperty("icons");
		expect(result).toHaveProperty("display");
	});

	test("should return consistent results on multiple calls", () => {
		const result1 = manifest();
		const result2 = manifest();

		expect(result1).toEqual(result2);
	});

	test("should be a function", () => {
		expect(typeof manifest).toBe("function");
	});
});

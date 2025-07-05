import { describe, expect } from "vitest";
import robots from "./robots";

describe("robots", () => {
	test("should return robots.txt configuration", () => {
		const result = robots();

		expect(result).toBeDefined();
		expect(typeof result).toBe("object");
	});

	test("should disallow all user agents from root", () => {
		const result = robots();

		expect(result.rules).toBeDefined();
		expect(result.rules.userAgent).toBe("*");
		expect(result.rules.disallow).toBe("/");
	});

	test("should have correct structure for MetadataRoute.Robots", () => {
		const result = robots();

		expect(result).toHaveProperty("rules");
		expect(result.rules).toHaveProperty("userAgent");
		expect(result.rules).toHaveProperty("disallow");
	});

	test("should block all robots from accessing the site", () => {
		const result = robots();

		// This configuration prevents all web crawlers from accessing any page
		expect(result.rules.userAgent).toBe("*");
		expect(result.rules.disallow).toBe("/");
	});

	test("should be a function that returns an object", () => {
		expect(typeof robots).toBe("function");
		expect(typeof robots()).toBe("object");
	});
});

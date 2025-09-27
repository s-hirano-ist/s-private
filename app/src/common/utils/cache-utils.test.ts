import { describe, expect, test } from "vitest";
import { sanitizeCacheTag } from "./cache-utils";

describe("sanitizeCacheTag", () => {
	test("should keep only alphabets and underscores", () => {
		const userId = "abc123_DEF456";
		const result = sanitizeCacheTag(userId);
		expect(result).toBe("abc_DEF");
	});

	test("should remove Auth0-style user IDs with pipes and colons", () => {
		const userId = "auth0|6123456789abcdef";
		const result = sanitizeCacheTag(userId);
		expect(result).toBe("authabcdef");
	});

	test("should remove all special characters except underscores", () => {
		const userId = "user@domain.com|123:456-789_test";
		const result = sanitizeCacheTag(userId);
		expect(result).toBe("userdomaincom_test");
	});

	test("should handle empty string", () => {
		const userId = "";
		const result = sanitizeCacheTag(userId);
		expect(result).toBe("");
	});

	test("should return empty string if only special characters", () => {
		const userId = "123@#$%^&*(){}[]|\\:;\"'<>,.?/";
		const result = sanitizeCacheTag(userId);
		expect(result).toBe("");
	});

	test("should preserve underscores", () => {
		const userId = "user_123_test_456";
		const result = sanitizeCacheTag(userId);
		expect(result).toBe("user__test_");
	});

	test("should handle mixed case letters", () => {
		const userId = "AbC123dEf456_XyZ";
		const result = sanitizeCacheTag(userId);
		expect(result).toBe("AbCdEf_XyZ");
	});

	test("should handle Unicode characters", () => {
		const userId = "user日本語123_test";
		const result = sanitizeCacheTag(userId);
		expect(result).toBe("user_test");
	});
});

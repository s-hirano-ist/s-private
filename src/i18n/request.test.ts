import { beforeEach, describe, expect, vi } from "vitest";

// Mock next-intl/server
const mockGetRequestConfig = vi.fn();
vi.mock("next-intl/server", () => ({
	getRequestConfig: mockGetRequestConfig,
}));

// Mock routing
vi.mock("./routing", () => ({
	routing: {
		locales: ["ja", "en"],
		defaultLocale: "ja",
	},
}));

// Mock message imports
vi.mock("../../messages/ja.json", () => ({
	default: { hello: "こんにちは" },
}));

vi.mock("../../messages/en.json", () => ({
	default: { hello: "Hello" },
}));

describe("i18n/request", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetRequestConfig.mockImplementation((callback) => callback);
	});

	test("should return valid locale and messages", async () => {
		const { default: requestConfig } = await import("./request");

		const result = await requestConfig({
			requestLocale: Promise.resolve("ja"),
		});

		expect(result).toEqual({
			locale: "ja",
			messages: { hello: "こんにちは" },
		});
	});

	test("should use default locale for invalid locale", async () => {
		const { default: requestConfig } = await import("./request");

		const result = await requestConfig({
			requestLocale: Promise.resolve("fr"),
		});

		expect(result).toEqual({
			locale: "ja",
			messages: { hello: "こんにちは" },
		});
	});

	test("should use default locale when locale is null", async () => {
		const { default: requestConfig } = await import("./request");

		const result = await requestConfig({
			requestLocale: Promise.resolve(null),
		});

		expect(result).toEqual({
			locale: "ja",
			messages: { hello: "こんにちは" },
		});
	});

	test("should handle English locale", async () => {
		const { default: requestConfig } = await import("./request");

		const result = await requestConfig({
			requestLocale: Promise.resolve("en"),
		});

		expect(result).toEqual({
			locale: "en",
			messages: { hello: "Hello" },
		});
	});

	test("should use default locale for undefined locale", async () => {
		const { default: requestConfig } = await import("./request");

		const result = await requestConfig({
			requestLocale: Promise.resolve(),
		});

		expect(result).toEqual({
			locale: "ja",
			messages: { hello: "こんにちは" },
		});
	});
});

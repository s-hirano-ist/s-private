import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
const mockAuth = vi.fn();
const mockI18nMiddleware = vi.fn();
const mockCreateMiddleware = vi.fn();

vi.mock("next-intl/middleware", () => ({
	default: mockCreateMiddleware,
}));

vi.mock("@/features/auth/utils/auth", () => ({
	auth: mockAuth,
}));

vi.mock("./i18n/routing", () => ({
	routing: {},
}));

describe("middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateMiddleware.mockReturnValue(mockI18nMiddleware);
	});

	it("should redirect to sign-in when no session", async () => {
		mockAuth.mockResolvedValue(null);

		const mockRequest = {
			url: "https://example.com/some-path",
		} as NextRequest;

		const { default: middleware } = await import("./middleware");
		const result = await middleware(mockRequest);

		expect(result).toBeInstanceOf(NextResponse);
		expect(result.status).toBe(307); // Redirect status
	});

	it("should handle i18n routing when session exists", async () => {
		const mockSession = { user: { id: "123" } };
		mockAuth.mockResolvedValue(mockSession as any);
		mockI18nMiddleware.mockReturnValue(NextResponse.next());

		const mockRequest = {
			url: "https://example.com/some-path",
		} as NextRequest;

		const { default: middleware } = await import("./middleware");
		const result = await middleware(mockRequest);

		expect(mockAuth).toHaveBeenCalled();
		expect(mockI18nMiddleware).toHaveBeenCalledWith(mockRequest);
	});

	it("should create proper redirect URL for sign-in", async () => {
		mockAuth.mockResolvedValue(null);

		const mockRequest = {
			url: "https://example.com/protected-route",
		} as NextRequest;

		const { default: middleware } = await import("./middleware");
		const result = await middleware(mockRequest);

		expect(result).toBeInstanceOf(NextResponse);
		expect(result.status).toBe(307);
	});

	it("should handle different request URLs", async () => {
		mockAuth.mockResolvedValue(null);

		const testUrls = [
			"https://example.com/",
			"https://example.com/en/dashboard",
			"https://example.com/ja/settings",
		];

		const { default: middleware } = await import("./middleware");

		for (const url of testUrls) {
			const mockRequest = { url } as NextRequest;
			const result = await middleware(mockRequest);

			expect(result).toBeInstanceOf(NextResponse);
			expect(result.status).toBe(307);
		}
	});
});

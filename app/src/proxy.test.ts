import { getSessionCookie } from "better-auth/cookies";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import proxy, { config } from "./proxy";

const capturedRequests = vi.hoisted(() => [] as NextRequest[]);

vi.unmock("next/server");

vi.mock("better-auth/cookies", () => ({
	getSessionCookie: vi.fn(),
}));

vi.mock("./infrastructures/i18n/routing-config", () => ({
	routing: {
		defaultLocale: "ja",
		locales: ["en", "ja"],
	},
}));

vi.mock("next-intl/middleware", async () => {
	const { NextResponse: ActualNextResponse } =
		await vi.importActual<typeof import("next/server")>("next/server");

	return {
		default: vi.fn(() => (request: NextRequest) => {
			capturedRequests.push(request);
			return ActualNextResponse.next({
				request: { headers: request.headers },
			});
		}),
	};
});

describe("proxy CSP", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		capturedRequests.length = 0;
		vi.mocked(getSessionCookie).mockReturnValue("session");
	});

	test("returns the same browser CSP for equivalent requests", () => {
		const firstResponse = proxy(
			new NextRequest("https://example.com/ja/articles"),
		);
		const secondResponse = proxy(
			new NextRequest("https://example.com/ja/articles"),
		);

		const firstPolicy = firstResponse.headers.get("content-security-policy");
		const secondPolicy = secondResponse.headers.get("content-security-policy");

		expect(firstPolicy).toBe(secondPolicy);
		expect(firstPolicy).not.toContain("nonce-");
		expect(capturedRequests[0].headers.get("x-nonce")).toBeNull();
		expect(
			capturedRequests[0].headers.get("content-security-policy"),
		).toBeNull();
		expect(
			firstResponse.headers.get("x-middleware-request-content-security-policy"),
		).toBeNull();
		expect(
			firstResponse.headers.get("x-middleware-request-x-nonce"),
		).toBeNull();
		expect(
			firstResponse.headers.get("content-security-policy-report-only"),
		).toBeNull();
	});

	test("adds enforced CSP to unauthenticated redirects", () => {
		vi.mocked(getSessionCookie).mockReturnValue(null);

		const response = proxy(new NextRequest("https://example.com/ja/articles"));

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe(
			"https://example.com/api/sign-in",
		);
		const contentSecurityPolicy = response.headers.get(
			"content-security-policy",
		);

		expect(contentSecurityPolicy).toContain("script-src 'self'");
		expect(contentSecurityPolicy).not.toContain("nonce-");
		expect(
			response.headers.get("x-middleware-request-content-security-policy"),
		).toBeNull();
		expect(response.headers.get("x-middleware-request-x-nonce")).toBeNull();
		expect(
			response.headers.get("content-security-policy-report-only"),
		).toBeNull();
	});

	test.each(["/error", "/ja/error", "/en/error"])(
		"allows unauthenticated access to the exact auth error path %s",
		(pathname) => {
			vi.mocked(getSessionCookie).mockReturnValue(null);

			const response = proxy(
				new NextRequest(`https://example.com${pathname}?error=state_mismatch`),
			);

			expect(response.status).toBe(200);
			expect(response.headers.get("location")).toBeNull();
			expect(getSessionCookie).not.toHaveBeenCalled();
			expect(capturedRequests).toHaveLength(1);
			expect(capturedRequests[0].nextUrl.pathname).toBe(pathname);
			expect(capturedRequests[0].nextUrl.searchParams.get("error")).toBe(
				"state_mismatch",
			);
			expect(response.headers.get("content-security-policy")).toContain(
				"script-src 'self'",
			);
			expect(response.headers.get("content-security-policy")).not.toContain(
				"nonce-",
			);
		},
	);

	test("keeps non-exact error subpaths protected", () => {
		vi.mocked(getSessionCookie).mockReturnValue(null);

		const response = proxy(
			new NextRequest("https://example.com/ja/error/details"),
		);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe(
			"https://example.com/api/sign-in",
		);
		expect(getSessionCookie).toHaveBeenCalledOnce();
	});

	test("excludes API and static asset routes from Proxy", () => {
		expect(
			unstable_doesMiddlewareMatch({
				config,
				nextConfig: {},
				url: "/api/health",
			}),
		).toBe(false);
		expect(
			unstable_doesMiddlewareMatch({
				config,
				nextConfig: {},
				url: "/_next/static/chunk.js",
			}),
		).toBe(false);
		expect(
			unstable_doesMiddlewareMatch({
				config,
				nextConfig: {},
				url: "/ja/articles",
			}),
		).toBe(true);
	});
});

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

vi.mock("./infrastructures/i18n/routing", () => ({
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

	test("passes a unique nonce and enforced CSP upstream", () => {
		const firstResponse = proxy(
			new NextRequest("https://example.com/ja/articles"),
		);
		const secondResponse = proxy(
			new NextRequest("https://example.com/ja/articles"),
		);

		const firstNonce = capturedRequests[0].headers.get("x-nonce");
		const secondNonce = capturedRequests[1].headers.get("x-nonce");
		const upstreamPolicy = capturedRequests[0].headers.get(
			"content-security-policy",
		);

		expect(firstNonce).toBeTruthy();
		expect(secondNonce).toBeTruthy();
		expect(firstNonce).not.toBe(secondNonce);
		expect(upstreamPolicy).toContain(`'nonce-${firstNonce}'`);
		expect(firstResponse.headers.get("content-security-policy")).toBe(
			upstreamPolicy,
		);
		expect(
			firstResponse.headers.get("x-middleware-request-content-security-policy"),
		).toBe(upstreamPolicy);
		expect(firstResponse.headers.get("x-middleware-request-x-nonce")).toBe(
			firstNonce,
		);
		expect(secondResponse.headers.get("content-security-policy")).toContain(
			`'nonce-${secondNonce}'`,
		);
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
		expect(response.headers.get("content-security-policy")).toContain(
			"'nonce-",
		);
		expect(
			response.headers.get("content-security-policy-report-only"),
		).toBeNull();
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

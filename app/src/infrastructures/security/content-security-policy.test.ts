import { describe, expect, test } from "vitest";
import { buildContentSecurityPolicy } from "./content-security-policy";

const BASE_OPTIONS = {
	nonce: "test-nonce",
	minioHost: "minio.example.com",
	minioPort: "443",
	reportUrl: "https://sentry.example.com/csp",
};

describe("buildContentSecurityPolicy", () => {
	test("builds a production policy that keeps script-src nonce-scoped", () => {
		const policy = buildContentSecurityPolicy({
			...BASE_OPTIONS,
			isDevelopment: false,
			isPreview: false,
		});

		expect(policy).toContain("script-src 'self' 'nonce-test-nonce'");
		expect(policy).toContain(
			"script-src-elem 'self' 'unsafe-inline' https://va.vercel-scripts.com",
		);
		expect(policy).not.toMatch(/script-src\s[^;]*'sha256-/u);
		expect(policy).not.toMatch(/script-src\s[^;]*'unsafe-inline'/u);
		expect(policy).not.toMatch(/script-src\s[^;]*'strict-dynamic'/u);
		expect(policy).not.toMatch(/script-src\s[^;]*'unsafe-eval'/u);
		expect(policy).toContain(
			"style-src-elem 'self' 'nonce-test-nonce' 'sha256-nzTgYzXYDNe6BAHiiI7NNlfK8n/auuOAhh2t92YvuXo=' 'sha256-Wwucq8eX2r0YFymkQhDXm5hN0+FfSvI3s4JSSaqa4iw='",
		);
		expect(policy).not.toMatch(/style-src-elem[^;]*'unsafe-inline'/u);
		expect(policy).toContain("style-src-attr 'unsafe-inline'");
		expect(policy).toContain(
			"img-src 'self' blob: data: https://books.google.com https://s-hirano.com https://minio.example.com",
		);
		expect(policy).toContain("upgrade-insecure-requests");
		expect(policy).toContain("report-uri https://sentry.example.com/csp");
	});

	test("adds only the documented Vercel Toolbar sources in preview", () => {
		const policy = buildContentSecurityPolicy({
			...BASE_OPTIONS,
			isDevelopment: false,
			isPreview: true,
		});

		expect(policy).toMatch(/script-src-elem[^;]*https:\/\/vercel\.live/u);
		expect(policy).toMatch(
			/connect-src[^;]*https:\/\/vercel\.live[^;]*wss:\/\/ws-us3\.pusher\.com/u,
		);
		expect(policy).toMatch(/style-src-elem[^;]*'unsafe-inline'/u);
		expect(policy).not.toMatch(/style-src-elem[^;]*'nonce-/u);
		expect(policy).toContain("frame-src https://vercel.live");
		expect(policy).toMatch(/font-src[^;]*https:\/\/assets\.vercel\.com/u);
	});

	test("allows development tooling without upgrading localhost requests", () => {
		const policy = buildContentSecurityPolicy({
			...BASE_OPTIONS,
			isDevelopment: true,
			isPreview: false,
		});

		expect(policy).toMatch(/script-src\s[^;]*'unsafe-eval'/u);
		expect(policy).toMatch(/script-src-elem[^;]*https:\/\/unpkg\.com/u);
		expect(policy).toMatch(/style-src-elem[^;]*'unsafe-inline'/u);
		expect(policy).toMatch(/connect-src[^;]*ws:/u);
		expect(policy).not.toContain("upgrade-insecure-requests");
	});
});

import { NextRequest, NextResponse } from "next/server";
import { env } from "./env.mjs";

// MEMO: worker-src 'self' blob:; for Sentry

export function cspHeader(request: NextRequest) {
	const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

	const cspHeader = `
        default-src 'self';
        script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com;
        style-src 'self' 'nonce-${nonce}';
        img-src 'self' blob: data: https://localhost:9000 https://private.s-hirano.com:9000 https://www.googletagmanager.com;
        font-src 'self';
        object-src 'none';
        connect-src 'self' https://www.google-analytics.com;
        worker-src 'self' blob:;
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
        report-uri ${env.SENTRY_REPORT_URL};
        report-to csp-endpoint;
    `;

	// Replace newline characters and spaces
	const contentSecurityPolicyHeaderValue = cspHeader
		.replace(/\s{2,}/g, " ")
		.trim();

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-nonce", nonce);

	requestHeaders.set(
		"Content-Security-Policy",
		contentSecurityPolicyHeaderValue,
	);

	const response = NextResponse.next({ request: { headers: requestHeaders } });
	response.headers.set(
		"Content-Security-Policy",
		contentSecurityPolicyHeaderValue,
	);

	return response;
}

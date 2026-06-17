import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./infrastructures/i18n/routing";
import { buildContentSecurityPolicy } from "./infrastructures/security/content-security-policy";

const handleI18nRouting = createMiddleware(routing);
const CSP_HEADER = "Content-Security-Policy";

function addCspResponseHeader(
	response: NextResponse,
	contentSecurityPolicy: string,
): NextResponse {
	response.headers.set(CSP_HEADER, contentSecurityPolicy);
	return response;
}

function addUpstreamRequestHeaders(
	response: NextResponse,
	requestHeaders: Headers,
): NextResponse {
	const upstreamResponse = NextResponse.next({
		request: { headers: requestHeaders },
	});

	for (const [key, value] of upstreamResponse.headers) {
		if (key !== "x-middleware-next" && key.startsWith("x-middleware-")) {
			response.headers.set(key, value);
		}
	}

	return response;
}

// Middleware gate: a lightweight session-cookie presence check (no DB hit, so it
// stays edge-friendly and avoids importing the Better Auth server instance).
// True session validation happens per-page via requireAuth()/getSelfId(), which
// call auth.api.getSession() and redirect to the unauthorized page on failure.
export default function proxy(request: NextRequest) {
	const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
	// Proxy needs deployment metadata before the application env module is loaded.
	// oxlint-disable-next-line node/no-process-env
	const isDevelopment = process.env.NODE_ENV === "development";
	// oxlint-disable-next-line node/no-process-env
	const isPreview = process.env.VERCEL_ENV === "preview";
	// oxlint-disable-next-line node/no-process-env
	const minioHost = process.env.MINIO_HOST;
	// oxlint-disable-next-line node/no-process-env
	const minioPort = process.env.MINIO_PORT;
	// oxlint-disable-next-line node/no-process-env
	const reportUrl = process.env.SENTRY_REPORT_URL;
	const contentSecurityPolicy = buildContentSecurityPolicy({
		nonce,
		isDevelopment,
		isPreview,
		minioHost,
		minioPort,
		reportUrl,
	});
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-nonce", nonce);
	// Next.js reads the enforced request header to apply the nonce during SSR.
	requestHeaders.set(CSP_HEADER, contentSecurityPolicy);
	const requestWithCsp = new NextRequest(request, {
		headers: requestHeaders,
	});

	const sessionCookie = getSessionCookie(requestWithCsp);
	if (!sessionCookie) {
		return addCspResponseHeader(
			addUpstreamRequestHeaders(
				NextResponse.redirect(new URL("/api/sign-in", request.url)),
				requestHeaders,
			),
			contentSecurityPolicy,
		);
	}

	return addCspResponseHeader(
		addUpstreamRequestHeaders(
			handleI18nRouting(requestWithCsp),
			requestHeaders,
		),
		contentSecurityPolicy,
	);
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|logo.png|manifest.webmanifest|not-found.png|monitoring).*)",
	],
};

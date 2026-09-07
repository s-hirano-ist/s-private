import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "./infrastructures/i18n/routing-config";
import { buildContentSecurityPolicy } from "./infrastructures/security/content-security-policy";

const handleI18nRouting = createMiddleware(routing);
const CSP_HEADER = "Content-Security-Policy";
const PUBLIC_AUTH_ERROR_PATHS = new Set<string>([
	"/error",
	...routing.locales.map((locale) => `/${locale}/error`),
]);

function addCspResponseHeader(
	response: NextResponse,
	contentSecurityPolicy: string,
): NextResponse {
	response.headers.set(CSP_HEADER, contentSecurityPolicy);
	return response;
}

// Middleware gate: a lightweight session-cookie presence check (no DB hit, so it
// stays edge-friendly and avoids importing the Better Auth server instance).
// True session validation happens per-page via requireAuth()/getSelfId(), which
// call auth.api.getSession() and redirect to the unauthorized page on failure.
export default function proxy(request: NextRequest) {
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
		isDevelopment,
		isPreview,
		minioHost,
		minioPort,
		reportUrl,
	});

	if (!PUBLIC_AUTH_ERROR_PATHS.has(request.nextUrl.pathname)) {
		const sessionCookie = getSessionCookie(request);
		if (!sessionCookie) {
			return addCspResponseHeader(
				NextResponse.redirect(new URL("/api/sign-in", request.url)),
				contentSecurityPolicy,
			);
		}
	}

	return addCspResponseHeader(
		handleI18nRouting(request),
		contentSecurityPolicy,
	);
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|logo.png|manifest.webmanifest|not-found.png|monitoring).*)",
	],
};

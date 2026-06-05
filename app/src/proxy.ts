import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./infrastructures/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

// Middleware gate: a lightweight session-cookie presence check (no DB hit, so it
// stays edge-friendly and avoids importing the Better Auth server instance).
// True session validation happens per-page via requireAuth()/getSelfId(), which
// call auth.api.getSession() and redirect to the unauthorized page on failure.
export default function proxy(request: NextRequest) {
	const sessionCookie = getSessionCookie(request);
	if (!sessionCookie) {
		return NextResponse.redirect(new URL("/api/sign-in", request.url));
	}

	return handleI18nRouting(request);
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|logo.png|manifest.webmanifest|not-found.png|monitoring).*)",
	],
};

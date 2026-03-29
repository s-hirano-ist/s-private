import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { auth } from "@/infrastructures/auth/auth-provider";
import { buildCspHeader } from "@/infrastructures/security/csp";
import { routing } from "./infrastructures/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

// Note: Using direct auth() call in proxy is the recommended approach
// for next-intl + NextAuth.js v5 integration.
// See: https://github.com/amannn/next-intl/issues/596

export default async function proxy(request: NextRequest) {
	const session = await auth();
	if (!session) {
		return NextResponse.redirect(new URL("/api/sign-in", request.url));
	}

	const nonce = crypto.randomBytes(16).toString("base64");
	request.headers.set("x-nonce", nonce);

	const response = handleI18nRouting(request);

	const csp = buildCspHeader(nonce, process.env.NODE_ENV === "development");
	response.headers.set("Content-Security-Policy", csp);

	return response;
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|logo.png|manifest.webmanifest|not-found.png|monitoring).*)",
	],
};

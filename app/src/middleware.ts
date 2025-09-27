import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { auth } from "@/infrastructures/auth/auth-provider";
import { routing } from "./infrastructures/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

// FIXME: https://github.com/amannn/next-intl/issues/596 auth((req))の方法である必要性確認

export default async function middleware(request: NextRequest) {
	const session = await auth();
	if (!session) {
		return NextResponse.redirect(new URL("/api/sign-in", request.url));
	}

	return handleI18nRouting(request);
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|logo.png|manifest.webmanifest|not-found.png|monitoring).*)",
	],
};

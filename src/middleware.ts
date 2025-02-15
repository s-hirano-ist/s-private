import { auth } from "@/features/auth/utils/auth";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { hasViewerAdminPermission } from "./features/auth/utils/session";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

// FIXME: https://github.com/amannn/next-intl/issues/596 auth((req))の方法である必要性確認

const ALLOWED_ADMIN_PATH_REGEX = /^\/(ja|en)\/viewer(\/.*)?$/;

export default async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const session = await auth();
	if (!session) {
		return NextResponse.redirect(new URL("/api/sign-in", request.url));
	}
	if (ALLOWED_ADMIN_PATH_REGEX.test(pathname)) {
		if (!(await hasViewerAdminPermission())) {
			const redirectUrl = request.nextUrl.clone();
			redirectUrl.pathname = "/not-allowed";
			return NextResponse.rewrite(redirectUrl);
		}
	}

	return handleI18nRouting(request);
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|logo.png|manifest.webmanifest|monitoring).*)",
	],
};

import { auth } from "@/features/auth/utils/auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

// MEMO: アクセスが禁止されているパスではなく、アクセスが許可されているパスを記述するべき。なぜなら、アクセスが禁止されているパスのすべてを把握するのは難しいからである。
const publicRoutes: string[] = [];

const handleI18nRouting = createMiddleware(routing);

export default auth(async function middleware(request) {
	const { nextUrl } = request;
	const auth = request.auth;

	const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
	if (isPublicRoute) return handleI18nRouting(request);

	if (!auth) return NextResponse.redirect(new URL("/api/sign-in", request.url));

	return handleI18nRouting(request);
});

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|logo.png|manifest.webmanifest).*)",
	],
};

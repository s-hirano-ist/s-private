import { auth } from "@/features/auth/utils/auth";
import { MiddlewareConfig, NextResponse } from "next/server";
import { DEFAULT_SIGN_IN_REDIRECT } from "./constants";
import { cspHeader } from "./csp-header";

// MEMO: アクセスが禁止されているパスではなく、アクセスが許可されているパスを記述するべき。なぜなら、アクセスが禁止されているパスのすべてを把握するのは難しいからである。
const publicRoutes: string[] = [];

const authRoutes: string[] = ["/auth"];
const apiAuthPrefix = "/api/auth";

export default auth((request) => {
	const { nextUrl } = request;
	const auth = request.auth;

	if (!auth) {
		return NextResponse.redirect(new URL("/api/sign-in", request.url));
	}

	const isLoggedIn = !!auth;

	const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
	const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
	const isAuthRoute = authRoutes.includes(nextUrl.pathname);

	if (isApiAuthRoute) return;

	if (isAuthRoute) {
		if (isLoggedIn)
			return NextResponse.redirect(new URL(DEFAULT_SIGN_IN_REDIRECT, nextUrl));
		return;
	}

	if (!isLoggedIn && !isPublicRoute)
		return NextResponse.redirect(new URL("/auth", nextUrl));

	return cspHeader(request);
});

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - sitemap.xml
		 * - robots.txt
		 */
		{
			source:
				"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
			missing: [
				{ type: "header", key: "next-router-prefetch" },
				{ type: "header", key: "purpose", value: "prefetch" },
			],
		},
	],
} satisfies MiddlewareConfig;

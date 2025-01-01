import { auth } from "@/features/auth/utils/auth";
import { DEFAULT_SIGN_IN_REDIRECT } from "./constants";

// FIXME: issue with edge compatibility
// Is it necessary for auth.config.ts and auth.ts to be a different file and use page.tsx auth?
// https://authjs.dev/guides/edge-compatibility
// import authConfig from "@/features/auth/utils/auth.config";
// import NextAuth from "next-auth";
// export const { auth: middleware } = NextAuth(authConfig);

// // MEMO: アクセスが禁止されているパスではなく、アクセスが許可されているパスを記述するべき。なぜなら、アクセスが禁止されているパスのすべてを把握するのは難しいからである。
const publicRoutes: string[] = [];

const authRoutes: string[] = ["/auth"];
const apiAuthPrefix = "/api/auth";

export default auth((request) => {
	const { nextUrl } = request;
	const auth = request.auth;
	const isLoggedIn = !!auth;

	const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
	const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
	const isAuthRoute = authRoutes.includes(nextUrl.pathname);

	if (isApiAuthRoute) return;

	if (isAuthRoute) {
		if (isLoggedIn)
			return Response.redirect(new URL(DEFAULT_SIGN_IN_REDIRECT, nextUrl));
		return;
	}

	if (!isLoggedIn && !isPublicRoute)
		return Response.redirect(new URL("/api/sign-in", nextUrl));

	return;
});

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
	],
};

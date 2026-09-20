import type { NextRequest } from "next/server";
import { env } from "@/env";
import { auth, isLocalDevAuthEnabled } from "@/infrastructures/auth/auth";
import prisma from "@/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

function redirectWithCookies(url: string | URL, authHeaders: Headers) {
	const redirectResponse = NextResponse.redirect(url);
	for (const cookie of authHeaders.getSetCookie()) {
		redirectResponse.headers.append("set-cookie", cookie);
	}
	return redirectResponse;
}

/**
 * Server-initiated sign-in. Mirrors the previous NextAuth `/api/sign-in` flow:
 * the proxy redirects unauthenticated requests here, and this route bounces the
 * browser to the Auth0 universal login screen.
 *
 * Better Auth's OAuth state is double-checked: a verification row in the DB AND
 * a signed `state` cookie set during sign-in. Because we initiate the flow
 * server-side via `auth.api`, we must forward the Set-Cookie headers Better Auth
 * produced onto our redirect response — otherwise the state cookie never reaches
 * the browser and the callback fails with `state_mismatch`.
 */
export async function GET(request: NextRequest) {
	const requestHeaders = await headers();

	if (isLocalDevAuthEnabled()) {
		const email = env.LOCAL_AUTH_EMAIL;
		const password = env.LOCAL_AUTH_PASSWORD;
		const name = env.LOCAL_AUTH_NAME;
		if (!email || !password || !name) {
			throw new Error("Local authentication configuration is incomplete");
		}

		const existingUser = await prisma.user.findUnique({ where: { email } });
		const result = existingUser
			? await auth.api.signInEmail({
					body: { email, password },
					headers: requestHeaders,
					returnHeaders: true,
				})
			: await auth.api.signUpEmail({
					body: { email, name, password },
					headers: requestHeaders,
					returnHeaders: true,
				});

		return redirectWithCookies(new URL("/", request.url), result.headers);
	}

	const { response, headers: authHeaders } = await auth.api.signInSocial({
		body: { provider: "auth0", callbackURL: "/" },
		headers: requestHeaders,
		returnHeaders: true,
	});
	if (!response.url) {
		throw new Error("Auth0 sign-in did not return a redirect URL");
	}

	return redirectWithCookies(response.url, authHeaders);
}

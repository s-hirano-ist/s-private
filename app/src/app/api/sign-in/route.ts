import { auth } from "@/infrastructures/auth/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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
export async function GET() {
	const { response, headers: authHeaders } = await auth.api.signInWithOAuth2({
		body: { providerId: "auth0", callbackURL: "/" },
		headers: await headers(),
		returnHeaders: true,
	});

	const redirectResponse = NextResponse.redirect(response.url);
	for (const cookie of authHeaders.getSetCookie()) {
		redirectResponse.headers.append("set-cookie", cookie);
	}
	return redirectResponse;
}

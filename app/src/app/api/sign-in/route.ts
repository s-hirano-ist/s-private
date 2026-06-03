import { auth } from "@/infrastructures/auth/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Server-initiated sign-in. Mirrors the previous NextAuth `/api/sign-in` flow:
 * the proxy redirects unauthenticated requests here, and this route bounces the
 * browser to the Auth0 universal login screen.
 *
 * Better Auth stores the OAuth state / PKCE verifier in the `verification`
 * table (not a cookie), so a plain server-side redirect to the authorization
 * URL is sufficient — no Set-Cookie forwarding is required.
 */
export async function GET() {
	const { url } = await auth.api.signInWithOAuth2({
		body: { providerId: "auth0", callbackURL: "/" },
		headers: await headers(),
	});
	return NextResponse.redirect(url);
}

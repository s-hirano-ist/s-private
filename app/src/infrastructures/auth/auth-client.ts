/**
 * Better Auth browser client.
 *
 * @remarks
 * Client-side counterpart to {@link file://./auth.ts}. Used by client components
 * for sign-in / sign-out. `baseURL` is omitted so requests target the same
 * origin, avoiding a `NEXT_PUBLIC_` environment variable. Must not import the
 * server `auth` instance or any server-only environment variables.
 *
 * @module
 */

import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * The Better Auth client. Exposes `signIn.oauth2(...)`, `signOut()`, session
 * hooks, etc. The genericOAuth client plugin enables the Auth0 (OIDC) flow.
 */
export const authClient = createAuthClient({
	plugins: [genericOAuthClient()],
});

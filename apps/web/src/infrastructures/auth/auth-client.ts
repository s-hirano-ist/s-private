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

import { createAuthClient } from "better-auth/react";

/**
 * The Better Auth client. Exposes `signIn.social(...)`, `signOut()`, session
 * hooks, etc. Generic OAuth providers use the standard social client API in
 * Better Auth 1.7 and therefore require no client plugin.
 */
export const authClient = createAuthClient();

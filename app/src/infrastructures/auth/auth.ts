/**
 * Better Auth server instance.
 *
 * @remarks
 * Replaces the previous NextAuth.js setup. Authentication is delegated to Auth0
 * via the genericOAuth plugin (OIDC discovery), while Better Auth owns session
 * and account persistence in CockroachDB through the Prisma adapter.
 *
 * The Prisma singleton ({@link prisma}) is the tenant-extended client, but the
 * Better Auth tables (user/session/account/verification) are intentionally
 * absent from the tenant extension whitelist, so tenant filtering never touches
 * them. The adapter accepts the extended client as-is.
 *
 * @module
 */

import "server-only";
import { env } from "@/env";
import prisma from "@/prisma";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { auth0, genericOAuth } from "better-auth/plugins/generic-oauth";

/** Auth0 tenant host (e.g. "your-tenant.auth0.com"), derived from the issuer URL. */
const auth0Domain = new URL(env.AUTH0_ISSUER_BASE_URL).host;

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

/**
 * The Better Auth instance.
 *
 * @remarks
 * - `database`: Prisma adapter on CockroachDB. The adapter uses
 *   create/findFirst/update/deleteMany (no `upsert`), so it is unaffected by the
 *   CockroachDB + adapter-pg `upsert` incompatibility.
 * - `genericOAuth` + `auth0`: Auth0 as the sole identity provider. The default
 *   callback is `/api/auth/oauth2/callback/auth0`.
 * - `session.expiresIn`: 30-day parity with the former NextAuth config.
 */
export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	secret: env.AUTH_SECRET,
	trustedOrigins: [env.BETTER_AUTH_URL],
	database: prismaAdapter(prisma, { provider: "cockroachdb" }),
	session: { expiresIn: THIRTY_DAYS_IN_SECONDS },
	plugins: [
		genericOAuth({
			config: [
				{
					...auth0({
						clientId: env.AUTH0_CLIENT_ID,
						clientSecret: env.AUTH0_CLIENT_SECRET,
						domain: auth0Domain,
					}),
					// Always show the Auth0 login screen (parity with the former
					// NextAuth `signIn("auth0", ..., { prompt: "login" })`).
					prompt: "login",
				},
			],
		}),
	],
});

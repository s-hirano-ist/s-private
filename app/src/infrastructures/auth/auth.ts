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
 * Imported from `better-auth/minimal` (not `better-auth`) to skip the built-in
 * Kysely default adapter, whose transitive `kysely` import fails to build
 * against the version resolved in this monorepo; the Prisma adapter is always
 * supplied, so the Kysely fallback is unused.
 *
 * @module
 */

import "server-only";
import type { BaseURLConfig } from "better-auth";
import { env } from "@/env";
import prisma from "@/prisma";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth/minimal";
import { auth0, genericOAuth } from "better-auth/plugins/generic-oauth";

/** Auth0 tenant host (e.g. "your-tenant.auth0.com"), derived from the issuer URL. */
const auth0Domain = new URL(env.AUTH0_ISSUER_BASE_URL).host;

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

/** Vercel preview/deployment URL pattern for this project (branch & hash forms). */
const VERCEL_PREVIEW_HOST = "s-private-*-s-hirano-ist-team.vercel.app";

/**
 * On Vercel, derive the base URL from the incoming request host so every preview
 * deployment authenticates against its own (dynamic) origin — `allowedHosts` are
 * also added to `trustedOrigins` automatically. Locally we keep the static URL,
 * otherwise the `https` protocol below would break `http://localhost`.
 */
const baseURL: BaseURLConfig = env.VERCEL
	? {
			allowedHosts: [new URL(env.BETTER_AUTH_URL).host, VERCEL_PREVIEW_HOST],
			fallback: env.BETTER_AUTH_URL,
			protocol: "https",
		}
	: env.BETTER_AUTH_URL;

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
	baseURL,
	secret: env.AUTH_SECRET,
	trustedOrigins: [env.BETTER_AUTH_URL, `https://${VERCEL_PREVIEW_HOST}`],
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

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

import type { BaseURLConfig } from "better-auth";
import type { DatabaseClient } from "s-private-backend/shared/database";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth/minimal";
import { auth0, genericOAuth } from "better-auth/plugins/generic-oauth";
import { withDiscoveryDiagnostics } from "s-private-backend/auth/discovery-diagnostics";
import {
	AuthInitializationError,
	createRecoverableAuth,
} from "s-private-backend/auth/recoverable-auth";
import { vercelPreviewHosts } from "s-private-backend/auth/web-origin";

export type AuthConfig = {
	AUTH_SECRET?: string;
	AUTH0_CLIENT_ID?: string;
	AUTH0_CLIENT_SECRET?: string;
	AUTH0_ISSUER_BASE_URL?: string;
	BETTER_AUTH_URL?: string;
	LOCAL_DEV_MODE: "true" | "false";
	NODE_ENV: "development" | "test" | "production";
	VERCEL?: string;
};
export function createBackendAuth(
	env: AuthConfig,
	prisma: DatabaseClient,
	report: {
		failure(error: AuthInitializationError): unknown;
		recovery(): unknown;
	},
) {
	/** Local authentication is never allowed on a Vercel deployment. */
	const localDevAuthEnabled =
		env.LOCAL_DEV_MODE === "true" && env.VERCEL !== "1";

	function isLocalDevAuthEnabled(): boolean {
		return localDevAuthEnabled;
	}

	/** Auth0 tenant host (e.g. "your-tenant.auth0.com"), derived from the issuer URL. */
	const auth0Domain = localDevAuthEnabled
		? undefined
		: new URL(env.AUTH0_ISSUER_BASE_URL ?? "").host;

	const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

	/**
	 * On Vercel, derive the base URL from the incoming request host so every preview
	 * deployment authenticates against its own (dynamic) origin — `allowedHosts` are
	 * also added to `trustedOrigins` automatically. Locally we keep the static URL,
	 * otherwise the `https` protocol below would break `http://localhost`.
	 */
	const baseURL: BaseURLConfig = env.VERCEL
		? {
				allowedHosts: [
					...(env.BETTER_AUTH_URL ? [new URL(env.BETTER_AUTH_URL).host] : []),
					...vercelPreviewHosts,
				],
				...(env.BETTER_AUTH_URL ? { fallback: env.BETTER_AUTH_URL } : {}),
				protocol: "https",
			}
		: (env.BETTER_AUTH_URL ?? "http://localhost:3000");

	/**
	 * The Better Auth instance.
	 *
	 * @remarks
	 * - `database`: Prisma adapter on CockroachDB. The adapter uses
	 *   create/findFirst/update/deleteMany (no `upsert`), so it is unaffected by the
	 *   CockroachDB + adapter-pg `upsert` incompatibility.
	 * - `genericOAuth` + `auth0`: Auth0 as the sole identity provider. The default
	 *   callback is `/api/auth/callback/auth0`.
	 * - `session.expiresIn`: 30-day parity with the former NextAuth config.
	 */
	function createInstance() {
		return betterAuth({
			baseURL,
			secret: env.AUTH_SECRET,
			trustedOrigins: [
				...(env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : []),
				...vercelPreviewHosts.map((host) => `https://${host}`),
			],
			onAPIError: { errorURL: "/error" },
			database: prismaAdapter(prisma, { provider: "cockroachdb" }),
			account: {
				additionalFields: {
					issuer: {
						type: "string",
						input: false,
						defaultValue: env.BETTER_AUTH_URL ?? env.AUTH0_ISSUER_BASE_URL,
					},
				},
			},
			emailAndPassword: { enabled: localDevAuthEnabled },
			session: { expiresIn: THIRTY_DAYS_IN_SECONDS },
			plugins: localDevAuthEnabled
				? []
				: [
						genericOAuth({
							config: [
								{
									...auth0({
										clientId: env.AUTH0_CLIENT_ID ?? "",
										clientSecret: env.AUTH0_CLIENT_SECRET ?? "",
										domain: auth0Domain ?? "",
									}),
									requireIdTokenVerification: true,
									prompt: "login",
								},
							],
						}),
					],
		});
	}
	const getAuth = createRecoverableAuth(async () => {
		const codes = new Set<string>();
		const initialize = async () => {
			try {
				const auth = createInstance();
				const context = await auth.$context;
				if (
					!localDevAuthEnabled &&
					!context.socialProviders.some((provider) => provider.id === "auth0")
				)
					throw new AuthInitializationError([...codes]);
				return auth;
			} catch {
				throw new AuthInitializationError([...codes]);
			}
		};
		return auth0Domain
			? withDiscoveryDiagnostics(
					new URL(`https://${auth0Domain}/.well-known/openid-configuration`),
					initialize,
					codes,
				)
			: initialize();
	}, report);
	return { getAuth, isLocalDevAuthEnabled };
}

export type BackendAuth = Awaited<
	ReturnType<ReturnType<typeof createBackendAuth>["getAuth"]>
>;

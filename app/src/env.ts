/**
 * Type-safe environment variable configuration.
 *
 * @remarks
 * Uses @t3-oss/env-nextjs with Zod for runtime validation.
 * Prevents builds with missing or invalid environment variables.
 *
 * @see {@link https://env.t3.gg | T3 Env Documentation}
 *
 * @module
 */

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Validated environment variables.
 *
 * @remarks
 * Access environment variables through this object for type safety.
 * All variables are validated at build time.
 */
export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app isn't built with invalid env vars.
	 */
	server: {
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		/** CockroachDB connection string (used for both runtime and migrations; built-in pooling means no separate direct endpoint). @example "postgresql://USERNAME:PASSWORD@HOST:26257/DB_NAME?sslmode=verify-full" */
		DATABASE_URL: z
			.string()
			.refine(
				(v) =>
					process.env.NODE_ENV !== "production" ||
					v.includes("sslmode=verify-full"),
				"production では sslmode=verify-full 必須",
			),
		PUSHOVER_URL: z
			.string()
			.default("https://api.pushover.net/1/messages.json"),
		PUSHOVER_USER_KEY: z.string(),
		PUSHOVER_APP_TOKEN: z.string(),
		/** Shared bearer token used only by trusted batch scripts to invalidate Next.js caches. */
		CACHE_INVALIDATION_SECRET: z.string().optional(),
		/** Generate by `openssl rand -base64 32`. Required in production. Shared secret for Better Auth. */
		AUTH_SECRET:
			process.env.NODE_ENV === "production"
				? z.string()
				: z.string().optional(),
		/** Better Auth base URL (deployment origin, e.g. "https://example.com"). Used for baseURL / trustedOrigins. */
		BETTER_AUTH_URL: z.string().default("http://localhost:3000"),
		/** Set to "1" by Vercel on every deployment (prod & preview); absent locally. Gates dynamic baseURL resolution. */
		VERCEL: z.string().optional(),
		AUTH0_CLIENT_ID: z.string(),
		AUTH0_CLIENT_SECRET: z.string(),
		/** Auth0 tenant issuer URL (e.g. "https://your-tenant.auth0.com"). The host is used as the Better Auth genericOAuth `domain`. */
		AUTH0_ISSUER_BASE_URL: z.string(),
		SENTRY_AUTH_TOKEN: z.string(),
		SENTRY_REPORT_URL: z.string(),
		MINIO_HOST: z.string(),
		MINIO_PORT: z.number().default(443),
		MINIO_BUCKET_NAME: z.string(),
		MINIO_ACCESS_KEY: z.string(),
		MINIO_SECRET_KEY: z.string(),
		MINIO_USE_SSL: z.boolean().default(true),
		/** Cloudflare Access Service Token (MinIO等のCF Tunnel経由アクセスに必要) */
		CF_ACCESS_CLIENT_ID: z.string().optional(),
		/** Cloudflare Access Service Token (MinIO等のCF Tunnel経由アクセスに必要) */
		CF_ACCESS_CLIENT_SECRET: z.string().optional(),
		/** @example "http://localhost:6333" */
		QDRANT_URL: z.string(),
		QDRANT_API_KEY: z.string().optional(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app isn't built with invalid env vars. To expose them to the client, prefix them with `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_SENTRY_DSN: z.string(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g. middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		DATABASE_URL: process.env.DATABASE_URL,
		PUSHOVER_URL: process.env.PUSHOVER_URL,
		PUSHOVER_USER_KEY: process.env.PUSHOVER_USER_KEY,
		PUSHOVER_APP_TOKEN: process.env.PUSHOVER_APP_TOKEN,
		CACHE_INVALIDATION_SECRET: process.env.CACHE_INVALIDATION_SECRET,
		AUTH_SECRET: process.env.AUTH_SECRET,
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
		VERCEL: process.env.VERCEL,
		AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
		AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
		AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL,
		SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
		SENTRY_REPORT_URL: process.env.SENTRY_REPORT_URL,
		MINIO_HOST: process.env.MINIO_HOST,
		MINIO_PORT: Number(process.env.MINIO_PORT ?? "443"),
		MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME,
		MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
		MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
		MINIO_USE_SSL: process.env.MINIO_USE_SSL === "true",
		CF_ACCESS_CLIENT_ID: process.env.CF_ACCESS_CLIENT_ID,
		CF_ACCESS_CLIENT_SECRET: process.env.CF_ACCESS_CLIENT_SECRET,
		QDRANT_URL: process.env.QDRANT_URL,
		QDRANT_API_KEY: process.env.QDRANT_API_KEY,
		NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN, // MEMO: ok to leak
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful for Docker builds.
	 *
	 * Other non-validated env vars:
	 * - `NODE_TLS_REJECT_UNAUTHORIZED`: Set to "0" for self-signed certs only on localhost. {@link https://nodejs.org/api/cli.html#node_tls_reject_unauthorizedvalue}
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});

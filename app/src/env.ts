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

import { resolveBackendUrl } from "@/common/backend/resolve-backend-url";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const isVercelRuntime = process.env.VERCEL === "1";
const isVercelPreview = isVercelRuntime && process.env.VERCEL_ENV === "preview";
const deployedWebOriginSchema = isVercelPreview ? z.url().optional() : z.url();
const vercelSecret = isVercelRuntime ? z.string() : z.string().optional();

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
		/** Better Auth base URL (deployment origin, e.g. "https://example.com"). Used for baseURL / trustedOrigins. */
		BETTER_AUTH_URL: isVercelRuntime
			? deployedWebOriginSchema
			: z.url().default("http://localhost:3000"),
		/** Required independent backend origin. Web never hosts domain services. */
		BACKEND_URL: z.url().refine((value) => {
			const url = new URL(value);
			return (
				url.origin === value &&
				(url.protocol === "https:" ||
					(url.protocol === "http:" &&
						["localhost", "127.0.0.1"].includes(url.hostname)))
			);
		}, "backend must be an HTTPS origin (HTTP localhost allowed)"),
		/** Set to "1" by Vercel on every deployment (prod & preview); absent locally. Gates dynamic baseURL resolution. */
		VERCEL: z.string().optional(),
		VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
		/** Enables the hermetic local authentication and infrastructure path. Ignored on Vercel. */
		LOCAL_DEV_MODE: z.enum(["true", "false"]).default("false"),
		SENTRY_AUTH_TOKEN: vercelSecret,
		SENTRY_REPORT_URL: vercelSecret,
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app isn't built with invalid env vars. To expose them to the client, prefix them with `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: z.string().optional(),
		NEXT_PUBLIC_SENTRY_DSN: isVercelRuntime
			? z.string()
			: z.string().optional(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g. middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
		BACKEND_URL: resolveBackendUrl({
			vercel: process.env.VERCEL,
			vercelEnv: process.env.VERCEL_ENV,
			backendUrl: process.env.BACKEND_URL,
		}),
		VERCEL: process.env.VERCEL,
		VERCEL_ENV: process.env.VERCEL_ENV,
		LOCAL_DEV_MODE: process.env.LOCAL_DEV_MODE,
		SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
		SENTRY_REPORT_URL: process.env.SENTRY_REPORT_URL,
		NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY:
			process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
		NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
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

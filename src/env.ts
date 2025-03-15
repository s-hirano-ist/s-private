import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app isn't built with invalid env vars.
	 */
	server: {
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		PUSHOVER_URL: z.string(),
		PUSHOVER_USER_KEY: z.string(),
		PUSHOVER_APP_TOKEN: z.string(),
		AUTH_SECRET:
			process.env.NODE_ENV === "production"
				? z.string()
				: z.string().optional(),
		AUTH0_ID: z.string(),
		AUTH0_SECRET: z.string(),
		AUTH0_ISSUER: z.string(),
		SENTRY_AUTH_TOKEN: z.string(),
		SENTRY_REPORT_URL: z.string(),
		MINIO_HOST: z.string(),
		MINIO_PORT: z.number(),
		MINIO_BUCKET_NAME: z.string(),
		MINIO_ACCESS_KEY: z.string(),
		MINIO_SECRET_KEY: z.string(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app isn't built with invalid env vars. To expose them to the client, prefix them with `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_SENTRY_DSN: z.string(),
		NEXT_PUBLIC_G_TAG: z.string(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g. middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		PUSHOVER_URL: process.env.PUSHOVER_URL,
		PUSHOVER_USER_KEY: process.env.PUSHOVER_USER_KEY,
		PUSHOVER_APP_TOKEN: process.env.PUSHOVER_APP_TOKEN,
		AUTH_SECRET: process.env.AUTH_SECRET,
		AUTH0_ID: process.env.AUTH0_ID,
		AUTH0_SECRET: process.env.AUTH0_SECRET,
		AUTH0_ISSUER: process.env.AUTH0_ISSUER,
		SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
		SENTRY_REPORT_URL: process.env.SENTRY_REPORT_URL,
		MINIO_HOST: process.env.MINIO_HOST,
		MINIO_PORT: Number(process.env.MINIO_PORT),
		MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME,
		MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
		MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
		NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN, // MEMO: ok to leak
		NEXT_PUBLIC_G_TAG: process.env.NEXT_PUBLIC_G_TAG,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});

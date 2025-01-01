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
		LINE_NOTIFY_URL: z.string(),
		LINE_NOTIFY_SECRET_TOKEN: z.string(),
		AUTH_URL: z.preprocess(
			// This makes Vercel deployments not fail if you don't set AUTH_URL since Auth.js automatically uses the VERCEL_URL if present.
			(str) => process.env.VERCEL_URL ?? str,
			// VERCEL_URL doesn't include `https` so it cant be validated as a URL
			process.env.VERCEL ? z.string() : z.string().url(),
		),
		AUTH_SECRET:
			process.env.NODE_ENV === "production"
				? z.string()
				: z.string().optional(),
		SENTRY_AUTH_TOKEN: z.string(),
		SENTRY_REPORT_URL: z.string(),
		MINIO_HOST: z.string(),
		MINIO_PORT: z.number(),
		MINIO_BUCKET_NAME: z.string(),
		MINIO_ACCESS_KEY: z.string(),
		MINIO_SECRET_KEY: z.string(),
		GITHUB_CLIENT_ID: z.string(),
		GITHUB_CLIENT_SECRET: z.string(),
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
		LINE_NOTIFY_URL: process.env.LINE_NOTIFY_URL,
		LINE_NOTIFY_SECRET_TOKEN: process.env.LINE_NOTIFY_SECRET_TOKEN,
		AUTH_URL: process.env.AUTH_URL,
		AUTH_SECRET: process.env.AUTH_SECRET,
		SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
		SENTRY_REPORT_URL: process.env.SENTRY_REPORT_URL,
		MINIO_HOST: process.env.MINIO_HOST,
		MINIO_PORT: Number(process.env.MINIO_PORT),
		MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME,
		MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
		MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
		NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN, // MEMO: ok to leak
		NEXT_PUBLIC_G_TAG: process.env.NEXT_PUBLIC_G_TAG,
		GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
		GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
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

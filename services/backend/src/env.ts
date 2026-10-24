import { z } from "zod";

const optional = z.string().min(1).optional();
const schema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	VERCEL: optional,
	LOCAL_DEV_MODE: z.enum(["true", "false"]).default("false"),
	DATABASE_URL: z.string().min(1),
	BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
	AUTH_SECRET: z.string().min(32),
	AUTH0_CLIENT_ID: optional,
	AUTH0_CLIENT_SECRET: optional,
	AUTH0_ISSUER_BASE_URL: z.url().optional(),
	MOBILE_API_AUDIENCE: optional,
	LOCAL_AUTH_EMAIL: z.email().optional(),
	LOCAL_AUTH_PASSWORD: z.string().min(8).optional(),
	LOCAL_AUTH_NAME: optional,
	MINIO_HOST: optional,
	MINIO_PORT: z.coerce.number().int().min(1).max(65535).default(443),
	MINIO_BUCKET_NAME: optional,
	MINIO_ACCESS_KEY: optional,
	MINIO_SECRET_KEY: optional,
	MINIO_USE_SSL: z
		.enum(["true", "false"])
		.default("true")
		.transform((v) => v === "true"),
	CF_ACCESS_CLIENT_ID: optional,
	CF_ACCESS_CLIENT_SECRET: optional,
	QDRANT_URL: z.url(),
	QDRANT_API_KEY: optional,
	QDRANT_COLLECTION_NAME: z.string().min(1),
	EMBEDDING_URL: z.url(),
	PUSHOVER_URL: z.url().default("https://api.pushover.net/1/messages.json"),
	PUSHOVER_USER_KEY: optional,
	PUSHOVER_APP_TOKEN: optional,
	NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: optional,
	WEB_PUSH_PRIVATE_KEY: optional,
	WEB_PUSH_SUBJECT: optional,
	NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
	CRON_SECRET: z.string().min(16).optional(),
	BACKEND_CRON_ENABLED: z
		.enum(["true", "false"])
		.default("false")
		.transform((v) => v === "true"),
	BACKEND_PORT: z.coerce.number().int().min(1).max(65535).default(3002),
	NODE_TLS_REJECT_UNAUTHORIZED: optional,
});

export function parseBackendEnv(input: Record<string, string | undefined>) {
	const env = schema.parse(
		Object.fromEntries(
			Object.entries(input).map(([key, value]) => [
				key,
				value === "" ? undefined : value,
			]),
		),
	);
	const local = env.LOCAL_DEV_MODE === "true" && env.VERCEL !== "1";
	if (
		!local &&
		(!env.AUTH0_CLIENT_ID ||
			!env.AUTH0_CLIENT_SECRET ||
			!env.AUTH0_ISSUER_BASE_URL ||
			!env.MOBILE_API_AUDIENCE)
	)
		throw new Error("Auth0 configuration is required");
	if (
		local &&
		(!env.LOCAL_AUTH_EMAIL || !env.LOCAL_AUTH_PASSWORD || !env.LOCAL_AUTH_NAME)
	)
		throw new Error("Local authentication configuration is required");
	if (
		env.NODE_ENV === "production" &&
		(!env.DATABASE_URL.includes("sslmode=verify-full") ||
			env.NODE_TLS_REJECT_UNAUTHORIZED === "0")
	)
		throw new Error("Production requires verified database and outbound TLS");
	if (env.BACKEND_CRON_ENABLED && !env.CRON_SECRET)
		throw new Error("Enabled Cron requires CRON_SECRET");
	// Object storage is temporarily disabled in the composition root.
	// Its credentials must not prevent authentication and text content from starting.
	return env;
}
export type BackendEnv = ReturnType<typeof parseBackendEnv>;

export function loadBackendEnv(): BackendEnv {
	return parseBackendEnv(process.env);
}

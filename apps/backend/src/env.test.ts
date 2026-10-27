import { parseBackendEnv } from "s-private-backend/env";
import { describe, expect, test } from "vite-plus/test";

const local = {
	LOCAL_DEV_MODE: "true",
	DATABASE_URL: "postgresql://localhost/local?sslmode=disable",
	AUTH_SECRET: "test-secret".repeat(4),
	LOCAL_AUTH_EMAIL: "dev@example.test",
	LOCAL_AUTH_PASSWORD: "local-password",
	LOCAL_AUTH_NAME: "Developer",
	MINIO_HOST: "localhost",
	MINIO_PORT: "9000",
	MINIO_BUCKET_NAME: "test",
	MINIO_ACCESS_KEY: "test",
	MINIO_SECRET_KEY: "test",
	MINIO_USE_SSL: "false",
	QDRANT_URL: "http://localhost:6333",
	QDRANT_COLLECTION_NAME: "test",
	EMBEDDING_URL: "http://localhost:3001",
};
describe("standalone backend configuration", () => {
	test("Preview needs no fixed Web origin and cannot enable Cron", () => {
		const input = {
			...local,
			NODE_ENV: "production",
			VERCEL: "1",
			VERCEL_ENV: "preview",
			LOCAL_DEV_MODE: undefined,
			DATABASE_URL: "postgresql://db/test?sslmode=verify-full",
			AUTH0_CLIENT_ID: "client",
			AUTH0_CLIENT_SECRET: "secret",
			AUTH0_ISSUER_BASE_URL: "https://auth.example.com",
			MOBILE_API_AUDIENCE: "https://api.example.com",
		};
		expect(parseBackendEnv(input).BETTER_AUTH_URL).toBeUndefined();
		expect(parseBackendEnv(input).LOCAL_DEV_MODE).toBe("false");
		expect(() =>
			parseBackendEnv({ ...input, VERCEL_ENV: "production" }),
		).toThrow("BETTER_AUTH_URL");
		expect(() =>
			parseBackendEnv({ ...input, BETTER_AUTH_URL: "http://localhost:3000" }),
		).toThrow("HTTPS");
		expect(() =>
			parseBackendEnv({
				...input,
				BACKEND_CRON_ENABLED: "true",
				CRON_SECRET: "test-secret-long-enough",
			}),
		).toThrow("Preview");
	});
	test("starts in production with Qdrant Cloud and no separate embedding URL", () => {
		const env = parseBackendEnv({
			...local,
			NODE_ENV: "production",
			VERCEL: "1",
			BETTER_AUTH_URL: "https://web.example.com",
			LOCAL_DEV_MODE: "false",
			DATABASE_URL: "postgresql://db/test?sslmode=verify-full",
			AUTH0_CLIENT_ID: "test-client",
			AUTH0_CLIENT_SECRET: "test",
			AUTH0_ISSUER_BASE_URL: "https://auth.example.com",
			MOBILE_API_AUDIENCE: "https://api.example.com",
			EMBEDDING_URL: undefined,
		});
		expect(env.EMBEDDING_URL).toBeUndefined();
		expect(env.QDRANT_URL).toBe(local.QDRANT_URL);
	});
	test("starts without object storage credentials during the temporary outage", () => {
		const env = parseBackendEnv({
			...local,
			MINIO_HOST: undefined,
			MINIO_BUCKET_NAME: undefined,
			MINIO_ACCESS_KEY: undefined,
			MINIO_SECRET_KEY: undefined,
			MINIO_USE_SSL: "true",
			CF_ACCESS_CLIENT_ID: undefined,
			CF_ACCESS_CLIENT_SECRET: undefined,
		});
		expect(env.MINIO_HOST).toBeUndefined();
		expect(env.MINIO_SECRET_KEY).toBeUndefined();
	});
	test("parses port/SSL strictly and leaves Cron disabled", () => {
		const env = parseBackendEnv({ ...local, AUTH0_CLIENT_ID: "" });
		expect(env.AUTH0_CLIENT_ID).toBeUndefined();
		expect(env.MINIO_USE_SSL).toBe(false);
		expect(env.MINIO_PORT).toBe(9000);
		expect(env.BACKEND_PORT).toBe(3002);
		expect(env.BACKEND_CRON_ENABLED).toBe(false);
		expect(() => parseBackendEnv({ ...local, MINIO_USE_SSL: "yes" })).toThrow(
			"MINIO_USE_SSL",
		);
	});
	test("never uses local authentication on Vercel", () => {
		expect(() => parseBackendEnv({ ...local, VERCEL: "1" })).toThrow("Auth0");
	});
	test("fails closed on production TLS bypass and unverified DB", () => {
		expect(() => parseBackendEnv({ ...local, NODE_ENV: "production" })).toThrow(
			"TLS",
		);
		expect(() =>
			parseBackendEnv({
				...local,
				NODE_ENV: "production",
				DATABASE_URL: "postgresql://db/test?sslmode=verify-full",
				NODE_TLS_REJECT_UNAUTHORIZED: "0",
			}),
		).toThrow("TLS");
	});
	test("requires a secret before enabling Cron", () => {
		expect(() =>
			parseBackendEnv({ ...local, BACKEND_CRON_ENABLED: "true" }),
		).toThrow("CRON_SECRET");
	});
});

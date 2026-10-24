import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

// Run against either the source entrypoint or an isolated Vercel Function output.
// Only synthetic credentials are used; no database or object storage is contacted.
Object.assign(process.env, {
	NODE_ENV: "test",
	VERCEL: "1",
	LOCAL_DEV_MODE: "false",
	DATABASE_URL: "postgresql://127.0.0.1:1/unused?sslmode=verify-full",
	AUTH_SECRET: "test".repeat(16),
	AUTH0_CLIENT_ID: "test",
	AUTH0_CLIENT_SECRET: "test",
	AUTH0_ISSUER_BASE_URL: "https://auth.example.com",
	MOBILE_API_AUDIENCE: "test",
	BETTER_AUTH_URL: "https://private.s-hirano.com",
	MINIO_HOST: "localhost",
	MINIO_PORT: "9000",
	MINIO_USE_SSL: "false",
	MINIO_BUCKET_NAME: "test",
	MINIO_ACCESS_KEY: "test",
	MINIO_SECRET_KEY: "test",
	QDRANT_URL: "http://127.0.0.1:1",
	QDRANT_COLLECTION_NAME: "test",
	EMBEDDING_URL: "http://127.0.0.1:1",
	BACKEND_CRON_ENABLED: "false",
});
delete process.env.NEXT_PUBLIC_SENTRY_DSN;
const entrypoint = process.argv[2]
	? pathToFileURL(process.argv[2])
	: new URL("../src/index.ts", import.meta.url);
const { default: app } = await import(entrypoint.href);
for (const [path, status] of [
	["/health", 200],
	["/api/v1/session", 401],
]) {
	const response = await app.fetch(
		new Request(`https://api.s-hirano.com${path}`),
	);
	assert.equal(response.status, status, `${path}: ${await response.text()}`);
	console.log(`${path}: ${status}`);
}
process.exit(0);

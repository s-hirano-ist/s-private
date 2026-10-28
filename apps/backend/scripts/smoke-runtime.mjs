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
	QDRANT_URL: "http://127.0.0.1:1",
	QDRANT_COLLECTION_NAME: "test",
	BACKEND_CRON_ENABLED: "false",
});
delete process.env.NEXT_PUBLIC_SENTRY_DSN;
delete process.env.EMBEDDING_URL;
Object.assign(process.env, {
	S3_ENDPOINT: "https://s3.us-west-004.backblazeb2.com",
	S3_REGION: "us-west-004",
	S3_BUCKET_NAME: "test",
	S3_ACCESS_KEY_ID: "test",
	S3_SECRET_ACCESS_KEY: "test",
	S3_FORCE_PATH_STYLE: "false",
});
const entrypoint = process.argv[2]
	? pathToFileURL(process.argv[2])
	: new URL("../src/index.ts", import.meta.url);
const { default: app } = await import(entrypoint.href);
for (const [path, status] of [
	["/health", 200],
	["/api/v1/session", 401],
	["/api/v1/media/images/test/original", 401],
	["/api/v1/uploads/test", 401],
]) {
	const response = await app.fetch(
		new Request(`https://api.s-hirano.com${path}`),
	);
	assert.equal(response.status, status, `${path}: ${await response.text()}`);
	console.log(`${path}: ${status}`);
}
process.exit(0);

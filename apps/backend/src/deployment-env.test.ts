import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

const preview = {
	NODE_ENV: "production",
	VERCEL: "1",
	VERCEL_ENV: "preview",
	DATABASE_URL: "postgresql://db/preview?sslmode=verify-full",
	AUTH_SECRET: "test".repeat(16),
	AUTH0_CLIENT_ID: "preview-client",
	AUTH0_CLIENT_SECRET: "test",
	AUTH0_ISSUER_BASE_URL: "https://auth.example.test",
	MOBILE_API_AUDIENCE: "https://api.example.test",
	S3_ENDPOINT: "https://s3.us-west-004.backblazeb2.com",
	S3_REGION: "us-west-004",
	S3_BUCKET_NAME: "preview",
	S3_ACCESS_KEY_ID: "synthetic-key",
	S3_SECRET_ACCESS_KEY: "test",
	QDRANT_URL: "https://search.example.test",
	QDRANT_COLLECTION_NAME: "preview",
};

function validate(env: Readonly<Record<string, string>>) {
	return spawnSync(
		process.execPath,
		[fileURLToPath(new URL("../scripts/validate-env.mjs", import.meta.url))],
		{ encoding: "utf8", env },
	);
}

test("Vercel preflight accepts an isolated Preview configuration", () => {
	const result = validate(preview);
	expect(result.status).toBe(0);
	expect(result.stdout).toContain("environment is valid");
});

test("Vercel preflight rejects missing storage settings before deployment", () => {
	const input = Object.fromEntries(
		Object.entries(preview).filter(
			([key]: readonly [string, string]) => !key.startsWith("S3_"),
		),
	);
	const result = validate(input);
	expect(result.status).toBe(1);
	expect(result.stderr).toContain("S3_ENDPOINT");
	expect(result.stderr).toContain("S3_SECRET_ACCESS_KEY");
});

test("Vercel preflight omits invalid values and policy exceptions from logs", () => {
	const invalid = validate({
		...preview,
		S3_ENDPOINT: "ftp://private-invalid-value",
	});
	expect(invalid.status).toBe(1);
	expect(invalid.stderr).toContain("S3_ENDPOINT");
	expect(invalid.stderr).not.toContain("private-invalid-value");
	const policy = validate({ ...preview, BACKEND_CRON_ENABLED: "true" });
	expect(policy.status).toBe(1);
	expect(policy.stderr).toContain("deployment policy");
	expect(policy.stderr).not.toContain(preview.AUTH_SECRET);
});

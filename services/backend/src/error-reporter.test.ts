import { parseBackendEnv } from "s-private-backend/env";
import { createHttpErrorReporter } from "s-private-backend/error-reporter";
import { afterEach, expect, test, vi } from "vite-plus/test";

afterEach(() => vi.restoreAllMocks());

function setup() {
	const databaseUrl = new URL("postgresql://db/local");
	databaseUrl.username = "user";
	databaseUrl.password = "private-password";
	const env = parseBackendEnv({
		LOCAL_DEV_MODE: "true",
		S3_ENDPOINT: "http://localhost:9000",
		S3_REGION: "us-east-1",
		S3_BUCKET_NAME: "test",
		S3_ACCESS_KEY_ID: "private-storage-access",
		S3_SECRET_ACCESS_KEY: ["private", "storage", "secret"].join("-"),
		DATABASE_URL: databaseUrl.href,
		AUTH_SECRET: ["private", "auth", "secret"].join("-").repeat(3),
		AUTH0_CLIENT_SECRET: ["private", "client", "secret"].join("-"),
		LOCAL_AUTH_EMAIL: "dev@example.test",
		LOCAL_AUTH_PASSWORD: "local-password",
		LOCAL_AUTH_NAME: "Developer",
		QDRANT_URL: "https://qdrant.example",
		QDRANT_COLLECTION_NAME: "test",
	});
	const captureException = vi.fn<(error: Readonly<Error>) => unknown>();
	const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
	return {
		env,
		captureException,
		consoleError,
		reportError: createHttpErrorReporter(env, captureException),
	};
}

test("retains diagnostic message and stack in both sinks without serializing attached requests", () => {
	const { reportError, captureException, consoleError } = setup();
	const error = Object.assign(new TypeError("Invalid URL"), {
		request: { headers: { cookie: "private-cookie" } },
		cause: { password: "private-password" },
	});
	reportError(error);
	const diagnostic = captureException.mock.calls[0][0];
	expect(diagnostic.name).toBe("TypeError");
	expect(diagnostic.message).toBe("Invalid URL");
	expect(diagnostic.stack).toContain("error-reporter.test.ts");
	expect(diagnostic).not.toHaveProperty("request");
	expect(diagnostic).not.toHaveProperty("cause");
	expect(consoleError).toHaveBeenCalledWith("Unhandled backend HTTP error", {
		name: diagnostic.name,
		message: diagnostic.message,
		stack: diagnostic.stack,
	});
});

test("redacts configured credentials, headers and URL query values in both sinks", () => {
	const { env, reportError, captureException, consoleError } = setup();
	reportError(
		new Error(
			[
				env.DATABASE_URL,
				env.AUTH_SECRET,
				env.AUTH0_CLIENT_SECRET,
				env.S3_ACCESS_KEY_ID,
				env.S3_SECRET_ACCESS_KEY,
				"Bearer private-token",
				"Cookie: state=private-cookie",
				"https://auth.example/callback?code=private-code",
				"https://user:private-url-password@auth.example/",
			].join("\n"),
		),
	);
	const diagnostic = captureException.mock.calls[0][0];
	const output = JSON.stringify(consoleError.mock.calls) + diagnostic.stack;
	for (const value of [
		env.DATABASE_URL,
		env.AUTH_SECRET,
		env.AUTH0_CLIENT_SECRET,
		env.S3_ACCESS_KEY_ID,
		env.S3_SECRET_ACCESS_KEY,
		"private-token",
		"private-cookie",
		"private-code",
		"private-url-password",
	]) {
		expect(output).not.toContain(value);
	}
	expect(output).toContain("[REDACTED]");
});

test("does not serialize non-Error thrown values", () => {
	const { reportError, captureException, consoleError } = setup();
	reportError({ cookie: "private-cookie" });
	expect(captureException.mock.calls[0]?.[0]?.message).toBe(
		"Unknown backend error",
	);
	expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
		"private-cookie",
	);
});

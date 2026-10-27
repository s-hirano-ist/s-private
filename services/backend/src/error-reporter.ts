import type { BackendEnv } from "s-private-backend/env";

/** Only diagnostic Error fields reach either sink; never serialize request/error objects. */
export function createHttpErrorReporter(
	env: BackendEnv,
	captureException: (error: Error) => unknown,
) {
	const secrets = [
		env.DATABASE_URL,
		env.AUTH_SECRET,
		env.AUTH0_CLIENT_SECRET,
		env.LOCAL_AUTH_PASSWORD,
		env.QDRANT_API_KEY,
		env.S3_ACCESS_KEY_ID,
		env.S3_SECRET_ACCESS_KEY,
		env.WEB_PUSH_PRIVATE_KEY,
		env.PUSHOVER_APP_TOKEN,
		env.CRON_SECRET,
	].filter((value): value is string => Boolean(value));
	function redact(input: string) {
		let value = input;
		for (const secret of secrets)
			value = value.replaceAll(secret, "[REDACTED]");
		return value
			.replaceAll(/\bBearer\s+[^\s,;]+/giu, "Bearer [REDACTED]")
			.replaceAll(
				/\b(?:cookie|authorization|set-cookie)\s*[:=][^\r\n]*/giu,
				"[REDACTED HEADER]",
			)
			.replaceAll(/\b(?:https?|postgres(?:ql)?):\/\/\S+/giu, (match) => {
				try {
					const url = new URL(match);
					if (!url.username && !url.password && !url.search && !url.hash)
						return match;
					if (url.username || url.password) {
						url.username = "REDACTED";
						url.password = "";
					}
					if (url.search || url.hash) url.search = "?[REDACTED]";
					url.hash = "";
					return url.href;
				} catch {
					return "[REDACTED URL]";
				}
			});
	}
	return (error: unknown) => {
		const diagnostic = new Error(
			error instanceof Error ? redact(error.message) : "Unknown backend error",
		);
		if (error instanceof Error) {
			diagnostic.name = redact(error.name);
			diagnostic.stack = error.stack ? redact(error.stack) : undefined;
		}
		// oxlint-disable-next-line no-console -- Vercel must retain failures even when Sentry is unavailable.
		console.error("Unhandled backend HTTP error", {
			name: diagnostic.name,
			message: diagnostic.message,
			stack: diagnostic.stack,
		});
		return captureException(diagnostic);
	};
}

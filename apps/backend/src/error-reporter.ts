import type { BackendEnv } from "s-private-backend/env";
import { createDiagnosticError } from "@s-hirano-ist/s-infrastructure/observability/diagnostic-error";

/** Only diagnostic Error fields reach either sink; never serialize request/error objects. */
export function createHttpErrorReporter(
	env: BackendEnv,
	captureException: (error: Error) => unknown,
) {
	const diagnose = createDiagnosticError(env);
	return (error: unknown) => {
		const diagnostic = diagnose(error);
		// oxlint-disable-next-line no-console -- Vercel must retain failures even when Sentry is unavailable.
		console.error("Unhandled backend HTTP error", {
			name: diagnostic.name,
			message: diagnostic.message,
			stack: diagnostic.stack,
		});
		return captureException(diagnostic);
	};
}

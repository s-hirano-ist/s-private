import "@s-hirano-ist/s-database/resolve-db-env";
import * as Sentry from "@sentry/nextjs";

export async function register() {
	// Defense-in-depth: NODE_TLS_REJECT_UNAUTHORIZED=0 disables TLS verification for
	// every outbound connection in the process (Auth0, Pushover, MinIO, Postgres).
	// It is only acceptable for local self-signed certs and must never reach prod.
	if (
		process.env.NODE_ENV === "production" &&
		process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0"
	) {
		console.error(
			"[FATAL] NODE_TLS_REJECT_UNAUTHORIZED=0 is set in production. Aborting to prevent silent TLS bypass.",
		);
		process.exit(1);
	}

	if (process.env.NEXT_RUNTIME === "nodejs") {
		await import("../sentry.server.config");
		// Initialize event handlers for domain events
		const { initializeEventHandlers } = await import(
			"@/infrastructures/events/event-setup"
		);
		initializeEventHandlers();
	}

	if (process.env.NEXT_RUNTIME === "edge") {
		await import("../sentry.edge.config");
	}
}

export const onRequestError = Sentry.captureRequestError;

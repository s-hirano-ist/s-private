import { createDiagnosticError } from "@s-hirano-ist/s-infrastructure/observability/diagnostic-error";
import { ServerLogger } from "@s-hirano-ist/s-infrastructure/observability/server-logger";
import { createPushoverService } from "@s-hirano-ist/s-notification";
import * as Sentry from "@sentry/node";

const dryRun = () => process.argv.includes("--dry-run");
let initialized = false;

function initialize() {
	if (initialized || dryRun()) return;
	initialized = true;
	if (!process.env.NEXT_PUBLIC_SENTRY_DSN)
		console.warn(
			"NEXT_PUBLIC_SENTRY_DSN is not set; errors will only be logged locally and critical alerts sent via Pushover.",
		);
	try {
		Sentry.init({
			dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
			enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
			// The runner owns reporting and flushing, including handled item failures.
			defaultIntegrations: false,
			dataCollection: {
				userInfo: false,
				cookies: false,
				httpHeaders: false,
				httpBodies: [],
				urlQueryParams: false,
				databaseQueryData: false,
				stackFrameVariables: false,
			},
			beforeSend(event) {
				delete event.request;
				delete event.breadcrumbs;
				return event;
			},
		});
	} catch (error) {
		console.error(
			"Failed to initialize Sentry",
			createDiagnosticError(process.env)(error),
		);
	}
}

function logger() {
	initialize();
	const diagnose = createDiagnosticError(process.env);
	return new ServerLogger(
		createPushoverService({
			url:
				process.env.PUSHOVER_URL ?? "https://api.pushover.net/1/messages.json",
			userKey: process.env.PUSHOVER_USER_KEY ?? "",
			appToken: process.env.PUSHOVER_APP_TOKEN ?? "",
		}),
		{
			captureException: (error, context) =>
				Sentry.captureException(diagnose(error), context),
			captureMessage: (message, context) =>
				Sentry.captureMessage(message, context),
		},
	);
}

/** Handled item failures are recorded without paging or changing the command result. */
export function reportCliError(error: unknown, caller: string): void {
	const diagnostic = createDiagnosticError(process.env)(error);
	console.error(diagnostic);
	if (dryRun()) return;
	initialize();
	try {
		Sentry.captureException(diagnostic, {
			tags: { caller, severity: "normal" },
		});
	} catch (reportError) {
		console.error(
			"Failed to report error",
			createDiagnosticError(process.env)(reportError),
		);
	}
}

/** Completion delivery errors are recorded by the logger and never fail the job. */
export const cliNotifications = {
	async notifyInfo(
		message: string,
		context: { caller?: string; userId?: string },
	) {
		if (dryRun()) return;
		await logger().info(
			message,
			{ ...context, caller: context.caller ?? "cli", status: 200 },
			{ notifyCompletion: true },
		);
	},
};

/** Owns the command boundary: initialization, failure notification and final flush. */
export async function runCli(caller: string, execute: () => Promise<unknown>) {
	try {
		initialize();
		await execute();
	} catch (error) {
		process.exitCode = 1;
		const diagnostic = createDiagnosticError(process.env)(error);
		console.error(diagnostic);
		if (!dryRun())
			await logger().error(
				`${caller} failed`,
				{ caller, status: 500 },
				diagnostic,
				{ severity: "critical" },
			);
	} finally {
		if (initialized && !dryRun()) {
			try {
				if (!(await Sentry.flush(2000)))
					console.error("Sentry flush timed out");
			} catch (error) {
				console.error(
					"Sentry flush failed",
					createDiagnosticError(process.env)(error),
				);
			}
		}
	}
}

import type {
	LogContext,
	Logger,
	LogOptions,
} from "@s-hirano-ist/s-application/observability/logger.interface";
import type { ErrorReporter } from "@s-hirano-ist/s-application/observability/reporter";
import type { NotificationService } from "@s-hirano-ist/s-notification";
import { mapStatusToLogLevel } from "@s-hirano-ist/s-infrastructure/observability/log-level";
import pino from "pino";

const pinoConfig = {
	browser: { asObject: true },
};

export class ServerLogger implements Logger {
	private logger: pino.Logger;
	private notificationService: NotificationService;

	private reporter: ErrorReporter;
	constructor(
		notificationService: NotificationService,
		reporter: ErrorReporter,
	) {
		this.reporter = reporter;
		this.logger = pino(pinoConfig);
		this.notificationService = notificationService;
	}

	async info(
		message: string,
		context: LogContext,
		options?: LogOptions,
	): Promise<void> {
		await this.logWithLevel("info", message, context, undefined, options);
	}

	async warn(
		message: string,
		context: LogContext,
		options?: LogOptions,
	): Promise<void> {
		await this.logWithLevel("warn", message, context, undefined, options);
	}

	async error(
		message: string,
		context: LogContext,
		error?: unknown,
		options?: LogOptions,
	): Promise<void> {
		await this.logWithLevel("error", message, context, error, options);
	}

	private async logWithLevel(
		level: "info" | "warn" | "error",
		message: string,
		context: LogContext,
		error?: unknown,
		options?: LogOptions,
	): Promise<void> {
		const expectedLevel = mapStatusToLogLevel(context.status);

		// If the provided level doesn't match the status code, use the mapped level
		const finalLevel = level === expectedLevel ? level : expectedLevel;

		const logData = {
			caller: context.caller,
			status: context.status,
			userId: context.userId,
			...context.additionalContext,
		};

		if (level === "error") {
			this.captureError(message, context, error);
		}

		// Handle additional error logging for console compatibility
		if (error !== undefined) {
			// oxlint-disable-next-line no-console -- This logger is the console sink, alongside Pino and the reporter.
			console.error("Additional error details:", error);
		}

		switch (finalLevel) {
			case "info":
				this.logger.info(logData, message);
				break;
			case "warn":
				this.logger.warn(logData, message);
				break;
			case "error":
				this.logger.error(logData, message);
				break;
		}

		// Send notification if requested
		if (options?.notify) {
			const notificationContext = {
				caller: context.caller,
				userId: context.userId,
			};
			try {
				switch (finalLevel) {
					case "info":
						await this.notificationService.notifyInfo(
							message,
							notificationContext,
						);
						break;
					case "warn":
						await this.notificationService.notifyWarning(
							message,
							notificationContext,
						);
						break;
					case "error":
						await this.notificationService.notifyError(
							message,
							notificationContext,
						);
						break;
				}
			} catch (notificationError) {
				// Log notification failures but don't throw to prevent cascade failures
				this.logger.warn(
					{ error: notificationError },
					"Failed to send notification",
				);
				this.reporter.captureException(notificationError, {
					tags: {
						caller: context.caller,
						error_type: "notification_delivery",
						status: String(context.status),
					},
					user: context.userId ? { id: context.userId } : undefined,
				});
			}
		}
	}

	private captureError(
		message: string,
		context: LogContext,
		error?: unknown,
	): void {
		const capturedError = this.findError(error);
		const options = {
			extra: {
				additionalContext: context.additionalContext,
				originalError: capturedError ? undefined : error,
			},
			tags: {
				caller: context.caller,
				error_type: capturedError?.name ?? "message",
				status: String(context.status),
			},
			user: context.userId ? { id: context.userId } : undefined,
		};

		if (capturedError) {
			this.reporter.captureException(capturedError, options);
			return;
		}
		this.reporter.captureMessage(message, { ...options, level: "error" });
	}

	private findError(value: unknown): Error | undefined {
		if (value instanceof Error) return value;
		if (
			typeof value === "object" &&
			value !== null &&
			"cause" in value &&
			value.cause instanceof Error
		) {
			return value.cause;
		}
		return undefined;
	}
}

// Note: The serverLogger instance will be created in server.ts with proper dependency injection

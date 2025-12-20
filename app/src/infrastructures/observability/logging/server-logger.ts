import "server-only";
import type { NotificationService } from "@s-hirano-ist/s-notification";
import pino from "pino";
import {
	type LogContext,
	type Logger,
	type LogOptions,
	mapStatusToLogLevel,
} from "./logger.interface";

const pinoConfig = {
	browser: { asObject: true },
};

export class ServerLogger implements Logger {
	private logger: pino.Logger;
	private notificationService: NotificationService;

	constructor(notificationService: NotificationService) {
		this.logger = pino(pinoConfig);
		this.notificationService = notificationService;
	}

	info(message: string, context: LogContext, options?: LogOptions): void {
		void this.logWithLevel("info", message, context, undefined, options);
	}

	warn(message: string, context: LogContext, options?: LogOptions): void {
		void this.logWithLevel("warn", message, context, undefined, options);
	}

	error(
		message: string,
		context: LogContext,
		error?: unknown,
		options?: LogOptions,
	): void {
		void this.logWithLevel("error", message, context, error, options);
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

		// Handle additional error logging for console compatibility
		if (error !== undefined) {
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
			}
		}
	}
}

// Note: The serverLogger instance will be created in server.ts with proper dependency injection

// Legacy compatibility exports for gradual migration - removed to avoid Next.js server action conflicts

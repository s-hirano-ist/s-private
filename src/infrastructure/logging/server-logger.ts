import "server-only";
import pino from "pino";
import {
	type LogContext,
	type Logger,
	type LogOptions,
	type MonitoringService,
	mapStatusToLogLevel,
} from "./logger.interface";

const pinoConfig = {
	browser: { asObject: true },
};

export class ServerLogger implements Logger {
	private logger: pino.Logger;
	private monitoringService: MonitoringService;

	constructor(monitoringService: MonitoringService) {
		this.logger = pino(pinoConfig);
		this.monitoringService = monitoringService;
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
			try {
				switch (finalLevel) {
					case "info":
						await this.monitoringService.notifyInfo(message, context);
						break;
					case "warn":
						await this.monitoringService.notifyWarning(message, context);
						break;
					case "error":
						await this.monitoringService.notifyError(message, context);
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

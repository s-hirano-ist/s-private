import "server-only";
import pino from "pino";
import {
	type LogContext,
	type Logger,
	mapStatusToLogLevel,
} from "./logger.interface";

const pinoConfig = {
	browser: { asObject: true },
};

class ServerLogger implements Logger {
	private logger: pino.Logger;

	constructor() {
		this.logger = pino(pinoConfig);
	}

	info(message: string, context: LogContext): void {
		this.logWithLevel("info", message, context);
	}

	warn(message: string, context: LogContext): void {
		this.logWithLevel("warn", message, context);
	}

	error(message: string, context: LogContext, error?: unknown): void {
		if (error !== undefined) {
			console.error("Additional error details:", error);
		}
		this.logWithLevel("error", message, context);
	}

	private logWithLevel(
		level: "info" | "warn" | "error",
		message: string,
		context: LogContext,
	): void {
		const expectedLevel = mapStatusToLogLevel(context.status);

		// If the provided level doesn't match the status code, use the mapped level
		const finalLevel = level === expectedLevel ? level : expectedLevel;

		const logData = {
			caller: context.caller,
			status: context.status,
			userId: context.userId,
			...context.additionalContext,
		};

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
	}
}

export const serverLogger = new ServerLogger();

// Legacy compatibility exports for gradual migration - removed to avoid Next.js server action conflicts

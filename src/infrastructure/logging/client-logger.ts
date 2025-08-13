"use client";
import {
	type LogContext,
	type Logger,
	mapStatusToLogLevel,
} from "./logger.interface";

class ClientLogger implements Logger {
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
			timestamp: new Date().toISOString(),
			...context.additionalContext,
		};

		switch (finalLevel) {
			case "info":
				console.error(`[INFO] ${message}`, logData);
				break;
			case "warn":
				console.error(`[WARN] ${message}`, logData);
				break;
			case "error":
				console.error(`[ERROR] ${message}`, logData);
				break;
		}
	}
}

export const clientLogger = new ClientLogger();

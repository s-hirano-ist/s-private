type LogLevel = "info" | "warn" | "error";

type HttpStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500;

type CallerName =
	| "addNews"
	| "deleteNews"
	| "addContents"
	| "addImage"
	| "deleteContents"
	| "deleteImage"
	| "checkSelfAuth"
	| "ErrorPage"
	| "UnexpectedComponent"
	| "wrapServerSideError";

export type LogContext = {
	caller: CallerName | string;
	status: HttpStatusCode;
	userId?: string;
	additionalContext?: Record<string, unknown>;
};

export type LogOptions = {
	notify?: boolean; // Whether to send Pushover notification
};

export type Logger = {
	info(message: string, context: LogContext, options?: LogOptions): void;
	warn(message: string, context: LogContext, options?: LogOptions): void;
	error(
		message: string,
		context: LogContext,
		error?: unknown,
		options?: LogOptions,
	): void;
};

export type MonitoringService = {
	notifyError(message: string, context: LogContext): Promise<void>;
	notifyWarning(message: string, context: LogContext): Promise<void>;
	notifyInfo(message: string, context: LogContext): Promise<void>;
};

/**
 * Maps HTTP status codes to appropriate log levels
 */
export function mapStatusToLogLevel(status: HttpStatusCode): LogLevel {
	if (status >= 500) return "error";
	if (status >= 400) return "warn";
	return "info";
}

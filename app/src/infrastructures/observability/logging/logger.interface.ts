type HttpStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500;

export type LogContext = {
	caller: string;
	status: HttpStatusCode;
	userId?: string;
	additionalContext?: Record<string, unknown>;
};

export type LogOptions = {
	notify?: boolean; // Whether to send notification
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

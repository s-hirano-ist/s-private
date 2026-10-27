type HttpStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500;

export type LogContext = {
	additionalContext?: Record<string, unknown>;
	caller: string;
	status: HttpStatusCode;
	userId?: string;
};

export type LogOptions = {
	notify?: boolean; // Whether to send notification
};

export type Logger = {
	error(
		message: string,
		context: LogContext,
		error?: unknown,
		options?: LogOptions,
	): Promise<void>;
	info(
		message: string,
		context: LogContext,
		options?: LogOptions,
	): Promise<void>;
	warn(
		message: string,
		context: LogContext,
		options?: LogOptions,
	): Promise<void>;
};

type LogLevel = "info" | "warn" | "error";

type HttpStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500;

/**
 * Maps HTTP status codes to appropriate log levels
 */
export function mapStatusToLogLevel(status: HttpStatusCode): LogLevel {
	if (status >= 500) return "error";
	if (status >= 400) return "warn";
	return "info";
}

export type CaptureContext = {
	extra?: Record<string, unknown>;
	level?: "error";
	tags?: Record<string, string>;
	user?: { id: string };
};
export type ErrorReporter = {
	captureException(error: unknown, context?: CaptureContext): unknown;
	captureMessage(message: string, context?: CaptureContext): unknown;
};

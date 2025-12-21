/**
 * Custom error classes for domain-specific error handling.
 *
 * @remarks
 * These errors are caught by wrapServerSideErrorForClient and
 * converted to appropriate client-safe responses with i18n message keys.
 *
 * @module
 */

/**
 * Error for unexpected system failures.
 *
 * @remarks
 * Used for unhandled exceptions that should be logged and notified.
 */
export class UnexpectedError extends Error {
	constructor() {
		super("unexpected");
		this.name = "UnexpectedError";
	}
}

/**
 * Error for invalid input format.
 *
 * @remarks
 * Thrown when FormData contains invalid value types.
 */
export class InvalidFormatError extends Error {
	constructor() {
		super("invalidFormat");
		this.name = "InvalidFormatError";
	}
}

/**
 * Error for duplicate resource creation attempts.
 *
 * @remarks
 * Thrown by domain services when uniqueness constraints are violated.
 */
export class DuplicateError extends Error {
	constructor() {
		super("duplicate");
		this.name = "DuplicateError";
	}
}

/**
 * Error for unsupported file types.
 *
 * @remarks
 * Thrown when uploaded files don't match allowed MIME types.
 */
export class FileNotAllowedError extends Error {
	constructor() {
		super("invalidFileFormat");
		this.name = "FileNotAllowedError";
	}
}

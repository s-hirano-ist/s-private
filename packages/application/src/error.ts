export type ApplicationErrorCode =
	| "NOT_FOUND"
	| "FORBIDDEN"
	| "UNAVAILABLE"
	| "DUPLICATE"
	| "NOT_DELETABLE"
	| "OPERATION_CONFLICT"
	| "OPERATION_IN_PROGRESS"
	| "UPLOAD_INCOMPLETE"
	| "UPLOAD_EXPIRED"
	| "UPLOAD_TOO_LARGE"
	| "VALIDATION_ERROR"
	| "INVALID_CHUNK_SIZE"
	| "INVALID_SYNC_CURSOR"
	| "INTERNAL_ERROR";
export class ApplicationError extends Error {
	constructor(readonly code: ApplicationErrorCode) {
		super(code);
		this.name = "ApplicationError";
	}
}

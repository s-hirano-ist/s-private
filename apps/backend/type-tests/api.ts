import { ApiError } from "s-private-backend/api/error";
// Compiled by the backend typecheck, never executed.
export function verifyInvalidCode() {
	// @ts-expect-error only contract error codes may be constructed.
	return new ApiError("UNKNOWN");
}
export function verifyInvalidStatus() {
	// @ts-expect-error status is derived from the code, never supplied by callers.
	return new ApiError("NOT_FOUND", 401);
}

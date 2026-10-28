import type { ApiErrorCode } from "@s-hirano-ist/s-api-contracts/errors";
import {
	ApplicationError,
	type ApplicationErrorCode,
} from "@s-hirano-ist/s-application/error";
import { HTTPException } from "hono/http-exception";
import { ApiError } from "s-private-backend/api/error";
const applicationCodes = {
	NOT_FOUND: "NOT_FOUND",
	FORBIDDEN: "FORBIDDEN",
	DUPLICATE: "DUPLICATE",
	NOT_DELETABLE: "NOT_DELETABLE",
	OPERATION_CONFLICT: "OPERATION_CONFLICT",
	OPERATION_IN_PROGRESS: "OPERATION_IN_PROGRESS",
	UPLOAD_INCOMPLETE: "UPLOAD_INCOMPLETE",
	UPLOAD_EXPIRED: "UPLOAD_EXPIRED",
	UPLOAD_TOO_LARGE: "UPLOAD_TOO_LARGE",
	VALIDATION_ERROR: "VALIDATION_ERROR",
	INVALID_CHUNK_SIZE: "INVALID_CHUNK_SIZE",
	INVALID_SYNC_CURSOR: "INVALID_SYNC_CURSOR",
	INTERNAL_ERROR: "INTERNAL_ERROR",
	UNAVAILABLE: "API_UNAVAILABLE",
} satisfies Record<ApplicationErrorCode, ApiErrorCode>;

export function apiErrorResponse(
	original: unknown,
	reportError: (error: unknown) => void,
): Response {
	let error = original;
	if (original instanceof ApplicationError)
		error = new ApiError(applicationCodes[original.code]);
	else if (original instanceof HTTPException && original.status === 400)
		error = new ApiError("VALIDATION_ERROR");
	const failure =
		error instanceof ApiError ? error : new ApiError("INTERNAL_ERROR");
	if (failure.status === 500) reportError(original);
	return Response.json(
		{ error: { code: failure.code } },
		{
			status: failure.status,
			headers: { "cache-control": "private, no-store" },
		},
	);
}

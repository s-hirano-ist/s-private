import { HTTPException } from "hono/http-exception";
import { ApiError } from "s-private-backend/api/error";

export function apiErrorResponse(
	original: unknown,
	reportError: (error: unknown) => void,
): Response {
	const error =
		original instanceof HTTPException && original.status === 400
			? new ApiError("VALIDATION_ERROR")
			: original;
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

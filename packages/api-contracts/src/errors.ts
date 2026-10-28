import { z } from "@hono/zod-openapi";

export const apiErrorDefinitions = [
	{ status: 401, codes: ["UNAUTHORIZED"] },
	{ status: 403, codes: ["FORBIDDEN"] },
	{ status: 404, codes: ["NOT_FOUND"] },
	{
		status: 409,
		codes: [
			"DUPLICATE",
			"NOT_DELETABLE",
			"OPERATION_CONFLICT",
			"OPERATION_IN_PROGRESS",
			"UPLOAD_INCOMPLETE",
		],
	},
	{ status: 410, codes: ["UPLOAD_EXPIRED"] },
	{ status: 413, codes: ["UPLOAD_TOO_LARGE"] },
	{
		status: 422,
		codes: ["VALIDATION_ERROR", "INVALID_CHUNK_SIZE", "INVALID_SYNC_CURSOR"],
	},
	{ status: 500, codes: ["INTERNAL_ERROR"] },
	{ status: 503, codes: ["API_UNAVAILABLE"] },
] as const;
export const apiErrorCodeSchema = z.enum(
	apiErrorDefinitions.flatMap((entry) => [...entry.codes]),
);
export type ApiErrorCode = z.output<typeof apiErrorCodeSchema>;
export function apiErrorStatus(code: ApiErrorCode) {
	for (const entry of apiErrorDefinitions) {
		if (entry.codes.some((candidate) => candidate === code))
			return entry.status;
	}
	throw new Error("Unknown API error code");
}

export function apiErrorResponseSchema(
	status: (typeof apiErrorDefinitions)[number]["status"],
) {
	const entry = apiErrorDefinitions.find(
		(candidate) => candidate.status === status,
	);
	if (!entry) throw new Error("Unknown API error status");
	return z
		.object({ error: z.object({ code: z.enum(entry.codes) }) })
		.openapi(`ApiError${status}`);
}

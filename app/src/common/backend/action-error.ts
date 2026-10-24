import type { ServerAction } from "@/common/types";
import { ApiHttpError } from "@s-hirano-ist/s-api-client";
import { captureException } from "@sentry/nextjs";
import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";

const apiMessages: Record<ApiHttpError["code"], string> = {
	DUPLICATE: "duplicated",
	VALIDATION_ERROR: "invalidFormat",
	UPLOAD_TOO_LARGE: "invalidFormat",
	INVALID_CHUNK_SIZE: "invalidFormat",
	FORBIDDEN: "notAllowed",
	NOT_DELETABLE: "notAllowed",
	UNAUTHORIZED: "unauthorized",
	API_UNAVAILABLE: "unexpected",
	INTERNAL_ERROR: "unexpected",
	INVALID_SYNC_CURSOR: "unexpected",
	NOT_FOUND: "unexpected",
	OPERATION_CONFLICT: "unexpected",
	OPERATION_IN_PROGRESS: "unexpected",
	UPLOAD_EXPIRED: "unexpected",
	UPLOAD_INCOMPLETE: "unexpected",
};

/** Translate public API failures without loading domain or infrastructure errors. */
export function backendActionError(
	error: unknown,
	formData?: FormData,
): ServerAction {
	unstable_rethrow(error);
	const values: Record<string, string> = {};
	for (const [key, value] of formData?.entries() ?? []) {
		if (typeof value === "string") values[key] = value;
	}
	let message = "unexpected";
	if (error instanceof ZodError) message = "invalidFormat";
	else if (error instanceof ApiHttpError) {
		message = apiMessages[error.code];
		if (error.status >= 500) captureException(error);
	} else captureException(error);
	return { success: false, message, ...(formData ? { formData: values } : {}) };
}

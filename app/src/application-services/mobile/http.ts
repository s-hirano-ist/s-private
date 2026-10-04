import { MobileApiError } from "@/application-services/mobile/auth";
import { defaultMobileDeps } from "@/application-services/mobile/deps";
import { ZodError } from "zod";

export function mobileJson(data: unknown, status = 200): Response {
	return Response.json(data, {
		status,
		headers: { "Cache-Control": "no-store" },
	});
}

export function mobileErrorResponse(error: unknown): Response {
	if (error instanceof MobileApiError) {
		return mobileJson({ error: { code: error.code } }, error.status);
	}
	if (error instanceof ZodError || error instanceof SyntaxError) {
		return mobileJson({ error: { code: "VALIDATION_ERROR" } }, 422);
	}
	if (defaultMobileDeps.errors.isRecordNotFoundError(error)) {
		return mobileJson({ error: { code: "NOT_FOUND" } }, 404);
	}
	return mobileJson({ error: { code: "INTERNAL_ERROR" } }, 500);
}

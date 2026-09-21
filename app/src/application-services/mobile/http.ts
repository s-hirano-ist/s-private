import { MobileApiError } from "@/application-services/mobile/auth";
import { Prisma } from "@s-hirano-ist/s-database";
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
	if (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === "P2025"
	) {
		return mobileJson({ error: { code: "NOT_FOUND" } }, 404);
	}
	return mobileJson({ error: { code: "INTERNAL_ERROR" } }, 500);
}

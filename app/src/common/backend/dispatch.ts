import "server-only";
import { forwardBackendRequest } from "@/common/backend/forward-request";
import { env } from "@/env";
import * as Sentry from "@sentry/nextjs";

export async function dispatchBackendRequest(
	request: Request,
): Promise<Response> {
	try {
		return await forwardBackendRequest(request, env.BACKEND_URL);
	} catch (error) {
		if (request.signal.aborted) throw error;
		Sentry.captureException(error, { tags: { source: "backend-transport" } });
		return Response.json(
			{ error: { code: "API_UNAVAILABLE" } },
			{ status: 503, headers: { "cache-control": "private, no-store" } },
		);
	}
}

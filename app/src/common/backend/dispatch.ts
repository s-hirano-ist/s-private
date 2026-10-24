import "server-only";
import { forwardBackendRequest } from "@/common/backend/forward-request";
import { env } from "@/env";
import * as Sentry from "@sentry/nextjs";

export async function dispatchBackendRequest(
	request: Request,
): Promise<Response> {
	if (env.BACKEND_URL) {
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
	// Remove after the manual deployment/cutover gate. Never retry writes on another host.
	if (new URL(request.url).pathname.startsWith("/api/v1/")) {
		const { backendApi } = await import("@/backend/api");
		return await backendApi.fetch(request);
	}
	const { signIn, authHandler } = await import("@/backend/embedded-auth");
	return new URL(request.url).pathname === "/api/sign-in"
		? signIn(request)
		: authHandler(request);
}

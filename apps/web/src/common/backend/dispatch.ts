import "server-only";
import { forwardBackendRequest } from "@/common/backend/forward-request";
import { env } from "@/env";
import * as Sentry from "@sentry/nextjs";
import { unstable_rethrow } from "next/navigation";

export async function dispatchBackendRequest(
	request: Request,
): Promise<Response> {
	// The shared boundary covers loader/Server Action backend work without recording inputs.
	const domain =
		/^\/api\/v1\/([a-z-]+)/u.exec(new URL(request.url).pathname)?.[1] ??
		"other";
	return Sentry.startSpan(
		{ name: `${request.method} ${domain}`, op: "app.backend" },
		async (span) => {
			try {
				const response = await forwardBackendRequest(request, env.BACKEND_URL);
				Sentry.setHttpStatus(span, response.status);
				return response;
			} catch (error) {
				// Uncached fetch can reject during PPR without contacting the backend.
				// Let Next.js resume dynamic work instead of caching a synthetic 503.
				unstable_rethrow(error);
				if (request.signal.aborted) throw error;
				Sentry.captureException(error, {
					tags: { source: "backend-transport" },
				});
				span.setStatus({ code: 2, message: "unavailable" });
				return Response.json(
					{ error: { code: "API_UNAVAILABLE" } },
					{ status: 503, headers: { "cache-control": "private, no-store" } },
				);
			}
		},
	);
}

import { env } from "@/env";
import { serverLogger } from "@/infrastructures/observability/server";
import {
	CACHE_INVALIDATION_DOMAINS,
	invalidateContentStatusCache,
} from "@/infrastructures/shared/cache/invalidate-content-status-cache";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

const requestSchema = z.object({
	domain: z.enum(CACHE_INVALIDATION_DOMAINS),
	userId: z.string().min(1),
});

function hasValidBearerToken(request: Request): boolean {
	const secret = env.CACHE_INVALIDATION_SECRET;
	const authorization = request.headers.get("authorization");
	if (!secret || !authorization?.startsWith("Bearer ")) return false;

	const supplied = authorization.slice("Bearer ".length);
	const suppliedBuffer = Buffer.from(supplied);
	const secretBuffer = Buffer.from(secret);

	return (
		suppliedBuffer.length === secretBuffer.length &&
		timingSafeEqual(suppliedBuffer, secretBuffer)
	);
}

export async function POST(request: Request): Promise<Response> {
	if (!env.CACHE_INVALIDATION_SECRET) {
		return Response.json(
			{ error: "Cache invalidation is not configured" },
			{ status: 503 },
		);
	}

	if (!hasValidBearerToken(request)) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const parsed = requestSchema.safeParse(
		await request.json().catch(() => null),
	);
	if (!parsed.success) {
		return Response.json({ error: "Invalid request" }, { status: 400 });
	}

	try {
		const tags = invalidateContentStatusCache(
			parsed.data.domain,
			parsed.data.userId,
		);

		return Response.json({ invalidated: tags.length });
	} catch (error) {
		await serverLogger.error(
			"Failed to invalidate content cache",
			{
				caller: "POST /api/internal/cache/invalidate",
				status: 500,
				userId: parsed.data.userId,
				additionalContext: {
					domain: parsed.data.domain,
				},
			},
			error,
		);

		return Response.json(
			{ error: "Failed to invalidate content cache" },
			{ status: 500 },
		);
	}
}

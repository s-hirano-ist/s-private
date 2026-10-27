import "server-only";
import { dispatchBackendRequest } from "@/common/backend/dispatch";
import { resolveWebOrigin } from "@/common/backend/resolve-web-origin";
import { env } from "@/env";
import { createBackendClient } from "@s-hirano-ist/s-api-client";
import { headers } from "next/headers";
import { redirect, unauthorized } from "next/navigation";
import { cache } from "react";

// Request-scoped Cookie/Origin binding for SSR and Server Actions.
export const getBackendClient = cache(async () => {
	const incoming = await headers();
	const origin = resolveWebOrigin({
		headers: incoming,
		betterAuthUrl: env.BETTER_AUTH_URL,
		vercel: env.VERCEL,
		vercelEnv: env.VERCEL_ENV,
	});
	return createBackendClient({
		baseURL: `${origin}/api/v1`,
		headers: { cookie: incoming.get("cookie") ?? "", origin },
		async fetch(input, init) {
			const response = await dispatchBackendRequest(new Request(input, init));
			if (response.status === 401) {
				// The proxy checks cookie presence; stale local cookies need a new session.
				if (env.LOCAL_DEV_MODE === "true" && env.VERCEL !== "1") {
					redirect("/api/sign-in");
				}
				unauthorized();
			}
			return response;
		},
	});
});

import "server-only";
import { backendApi } from "@/backend/api";
import { env } from "@/env";
import { createBackendClient } from "@s-hirano-ist/s-api-client";
import { headers } from "next/headers";
import { redirect, unauthorized } from "next/navigation";
import { cache } from "react";

// Request-scoped, in-process adapter until the independent backend is deployed.
export const getBackendClient = cache(async () => {
	const incoming = await headers();
	const origin = new URL(env.BETTER_AUTH_URL).origin;
	return createBackendClient({
		baseURL: `${origin}/api/v1`,
		headers: { cookie: incoming.get("cookie") ?? "", origin },
		async fetch(input, init) {
			const response = await backendApi.fetch(new Request(input, init));
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

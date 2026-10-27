"use client";
import { createBackendClient } from "@s-hirano-ist/s-api-client";
export function getBrowserBackendClient() {
	return createBackendClient({
		baseURL: new URL("/api/v1", window.location.origin).href,
		fetch: (input, init) =>
			globalThis.fetch(input, { ...init, credentials: "same-origin" }),
	});
}

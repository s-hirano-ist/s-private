"use client";
import { getBrowserBackendClient } from "@/common/backend/browser-client";

// Use the authenticated same-origin proxy so independent refreshes can run concurrently.
export async function refreshRss(ids: string[], force: boolean) {
	return (await getBrowserBackendClient().refreshRss({ ids, force })).data;
}

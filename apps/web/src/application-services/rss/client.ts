"use client";
import { getBrowserBackendClient } from "@/common/backend/browser-client";

// Background reads must not occupy Next.js's Server Action queue or navigation transitions.
export async function loadRss(
	offset = 0,
	feedId?: string,
	view: "unread" | "saved" | "feeds" = "unread",
	signal?: AbortSignal,
	snapshotRevision?: number,
) {
	return (
		await getBrowserBackendClient().getRssPage(
			{
				offset,
				feedId,
				view,
				...(snapshotRevision === undefined ? {} : { snapshotRevision }),
			},
			{ signal },
		)
	).data;
}

// Use the authenticated same-origin proxy so independent refreshes can run concurrently.
export async function refreshRss(ids: string[], force: boolean) {
	return (await getBrowserBackendClient().refreshRss({ ids, force })).data;
}

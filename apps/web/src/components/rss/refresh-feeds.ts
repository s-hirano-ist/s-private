import type { refreshRss } from "@/application-services/rss/client";

/** A free slot immediately takes the next feed; errors never discard queued feeds. */
export async function refreshFeeds(
	ids: readonly string[],
	force: boolean,
	refresh: typeof refreshRss,
	onComplete: (completed: number, failed: boolean, changed: boolean) => void,
) {
	let next = 0;
	let completed = 0;
	async function worker() {
		while (next < ids.length) {
			const id = ids[next++];
			let failed = false;
			let changed = false;
			try {
				const result = await refresh([id], force);
				failed = result.data.some((item) => item.status === "failed");
				changed = result.data.some(
					(item) => item.status === "updated" && item.changed !== false,
				);
			} catch {
				failed = true;
			}
			onComplete(++completed, failed, changed);
		}
	}
	await Promise.all(Array.from({ length: Math.min(5, ids.length) }, worker));
}

import type { RssService } from "@s-hirano-ist/s-application/rss/service";

export function createRssRefreshCron(
	config: { BACKEND_CRON_ENABLED: boolean; CRON_SECRET?: string },
	deps: {
		completed?: (
			summary: {
				processed: number;
				updated: number;
				failed: number;
				skipped: number;
				deferred: number;
			},
			durationMs: number,
		) => void;
		due(now: Date, limit: number): Promise<{ id: string; userId: string }[]>;
		now?: () => number;
		refresh(owner: string, id: string): ReturnType<RssService["refresh"]>;
		report(error: unknown): unknown;
	},
) {
	return async (request: Request): Promise<Response> => {
		if (!config.BACKEND_CRON_ENABLED)
			return new Response(null, { status: 404 });
		if (
			!config.CRON_SECRET ||
			request.headers.get("authorization") !== `Bearer ${config.CRON_SECRET}`
		)
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		const now = deps.now ?? Date.now;
		const started = now();
		const feeds = await deps.due(new Date(started), 100);
		let next = 0;
		const summary = {
			processed: 0,
			updated: 0,
			failed: 0,
			skipped: 0,
			deferred: 0,
		};
		async function worker() {
			while (next < feeds.length && now() - started < 210000) {
				const feed = feeds[next++];
				try {
					const results = await deps.refresh(feed.userId, feed.id);
					for (const result of results) summary[result.status]++;
				} catch (error) {
					summary.failed++;
					try {
						await deps.report(error);
					} catch {
						/* Keep draining other subscriptions. */
					}
				} finally {
					summary.processed++;
				}
			}
		}
		await Promise.all(
			Array.from({ length: Math.min(5, feeds.length) }, worker),
		);
		summary.deferred = feeds.length - next;
		try {
			deps.completed?.(summary, now() - started);
		} catch {
			/* Diagnostics do not change the result. */
		}
		return Response.json(summary);
	};
}

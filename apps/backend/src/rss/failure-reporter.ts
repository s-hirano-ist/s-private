import type { ErrorReporter } from "@s-hirano-ist/s-application/observability/reporter";
import type { RssFailureReporter } from "@s-hirano-ist/s-application/rss/failure";
/** Both sinks receive bounded diagnostics, never the original exception or feed URL. */
export function createRssFailureReporter(
	reporter: Pick<ErrorReporter, "captureException">,
	flush: () => Promise<unknown>,
): RssFailureReporter {
	return async (failure) => {
		const fields = {
			source: "rss_refresh",
			feedId: failure.feedId,
			hostname: failure.hostname,
			stage: failure.stage,
			reason: failure.reason,
			httpStatus: failure.httpStatus,
			networkCode: failure.networkCode,
			storageCode: failure.storageCode,
			durationMs: failure.durationMs,
			redirects: failure.redirects,
			bytes: failure.bytes,
		};
		// oxlint-disable-next-line no-console -- Vercel retains this diagnostic even when Sentry is unavailable.
		console.error("RSS refresh failed", fields);
		try {
			await reporter.captureException(
				new Error(`RSS refresh failed: ${failure.stage}/${failure.reason}`),
				{
					tags: {
						source: "rss_refresh",
						"rss.stage": failure.stage,
						"rss.reason": failure.reason,
					},
					extra: fields,
				},
			);
			await flush();
		} catch {
			/* The console diagnostic is retained if the error service is unavailable. */
		}
	};
}

import type {
	RssFailureReporter,
	RssRefreshFailure,
} from "@s-hirano-ist/s-application/rss/failure";
import type {
	RssFeedReader,
	RssImport,
	RssRepository,
} from "@s-hirano-ist/s-application/rss/ports";
import type { EntryInput, FeedInput } from "@s-hirano-ist/s-core/rss/types";
import { RssFetchError } from "@s-hirano-ist/s-application/rss/failure";
export function createRssService(
	repository: RssRepository,
	fetchFeed: RssFeedReader,
	reportFailure: RssFailureReporter,
) {
	async function report(
		error: unknown,
		feedId: string,
		stage: RssRefreshFailure["stage"],
		started: number,
		lease?: { url: string },
	) {
		let hostname: string | undefined;
		try {
			if (lease) hostname = new URL(lease.url).hostname;
		} catch {
			/* Invalid URLs are diagnosed without retaining their contents. */
		}
		const diagnostic: RssRefreshFailure = {
			feedId,
			stage,
			hostname,
			reason: stage === "fetch" ? "unknown_error" : "storage_error",
			storageCode:
				stage !== "fetch" &&
				typeof error === "object" &&
				error !== null &&
				"code" in error &&
				typeof error.code === "string" &&
				/^P\d{4}$/u.test(error.code)
					? error.code
					: undefined,
			durationMs: Math.round(performance.now() - started),
			...(error instanceof RssFetchError ? error.diagnostic : {}),
		};
		try {
			await reportFailure(diagnostic);
		} catch {
			/* Logging must not prevent lease release or other subscriptions. */
		}
	}
	return {
		page: (owner: string, offset: number, feedId?: string) =>
			repository.page(owner, offset, feedId),
		subscribe: (owner: string, input: FeedInput) =>
			repository.subscribe(owner, input),
		unsubscribe: (owner: string, id: string) =>
			repository.unsubscribe(owner, id),
		read: (
			owner: string,
			input: { before?: string; feedId?: string; ids?: string[] },
		) => repository.read(owner, input),
		save: (owner: string, input: EntryInput) => repository.save(owner, input),
		unsave: (owner: string, id: string) => repository.unsave(owner, id),
		async refresh(owner: string, ids: string[], force = false) {
			return Promise.all(
				ids.map(async (id) => {
					const started = performance.now();
					let lease;
					try {
						lease = await repository.claim(owner, id, force);
					} catch (error) {
						await report(error, id, "claim", started);
						throw error;
					}
					if (!lease) return { id, status: "skipped" as const };
					let stage: "fetch" | "complete" = "fetch";
					try {
						const result = await fetchFeed(lease);
						stage = "complete";
						await repository.complete(owner, lease, result);
						return { id, status: "updated" as const };
					} catch (error) {
						await report(error, id, stage, started, lease);
						try {
							await repository.fail(owner, lease);
						} catch (releaseError) {
							await report(releaseError, id, "release", started, lease);
							throw releaseError;
						}
						return { id, status: "failed" as const };
					}
				}),
			);
		},
		async import(owner: string, data: RssImport) {
			let added = 0;
			let duplicates = 0;
			for (const feed of data.feeds) {
				if (await repository.subscribe(owner, feed)) added++;
				else duplicates++;
			}
			for (const entry of data.saved) {
				if (await repository.save(owner, entry)) added++;
				else duplicates++;
			}
			return { added, duplicates, invalid: data.invalid };
		},
	};
}
export type RssService = ReturnType<typeof createRssService>;

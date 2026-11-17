import type {
	RssFailureReporter,
	RssRefreshFailure,
} from "@s-hirano-ist/s-application/rss/failure";
import type {
	RssFeedReader,
	RssImport,
	RssRepository,
} from "@s-hirano-ist/s-application/rss/ports";
import type {
	EntryInput,
	FeedInput,
	RssView,
} from "@s-hirano-ist/s-core/rss/types";
import { RssFetchError } from "@s-hirano-ist/s-application/rss/failure";
export function createRssService(
	repository: RssRepository,
	fetchFeed: RssFeedReader,
	reportFailure: RssFailureReporter,
	observe?: (
		stage: "page" | "claim" | "fetch" | "complete",
		durationMs: number,
	) => void,
) {
	async function measure<T>(
		stage: "page" | "claim" | "fetch" | "complete",
		work: () => Promise<T>,
	): Promise<T> {
		const started = performance.now();
		try {
			return await work();
		} finally {
			try {
				observe?.(stage, performance.now() - started);
			} catch {
				/* Keep diagnostics independent of reader operations. */
			}
		}
	}
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
		page: (owner: string, offset: number, feedId?: string, view?: RssView) =>
			measure("page", () => repository.page(owner, offset, feedId, view)),
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
						lease = await measure("claim", () =>
							repository.claim(owner, id, force),
						);
					} catch (error) {
						await report(error, id, "claim", started);
						throw error;
					}
					if (!lease) return { id, status: "skipped" as const };
					let stage: "fetch" | "complete" = "fetch";
					try {
						const claimed = lease;
						const result = await measure("fetch", () =>
							fetchFeed(
								force
									? { ...claimed, etag: null, lastModified: null }
									: claimed,
							),
						);
						stage = "complete";
						const changed = await measure("complete", () =>
							repository.complete(owner, claimed, {
								...result,
								repairMetadata: force,
							}),
						);
						return {
							id,
							status: "updated" as const,
							...(typeof changed === "boolean" ? { changed } : {}),
						};
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

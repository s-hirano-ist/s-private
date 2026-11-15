import type {
	RssFeedReader,
	RssImport,
	RssRepository,
} from "@s-hirano-ist/s-application/rss/ports";
import type { EntryInput, FeedInput } from "@s-hirano-ist/s-core/rss/types";
export function createRssService(
	repository: RssRepository,
	fetchFeed: RssFeedReader,
) {
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
					const lease = await repository.claim(owner, id, force);
					if (!lease) return { id, status: "skipped" as const };
					try {
						const result = await fetchFeed(lease);
						await repository.complete(owner, lease, result);
						return { id, status: "updated" as const };
					} catch {
						await repository.fail(owner, lease);
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

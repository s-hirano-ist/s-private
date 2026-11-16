import type { RssRepository } from "@s-hirano-ist/s-application/rss/ports";
import type { EntryInput, FeedInput } from "@s-hirano-ist/s-core/rss/types";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import { withTransactionRetry } from "@s-hirano-ist/s-database";
import { createHash, randomUUID } from "node:crypto";
const hash = (identity: string) =>
	createHash("sha256").update(identity).digest();
export function createRssRepository(db: DatabaseClient): RssRepository {
	return {
		async page(userId, offset, feedId) {
			const [feeds, unread, saved, unreadCount, savedCount] = await Promise.all(
				[
					db.rssFeed.findMany({
						where: { userId },
						orderBy: [{ folder: "asc" }, { title: "asc" }, { id: "asc" }],
					}),
					db.rssUnread.findMany({
						where: { userId, feedId },
						orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
						skip: offset,
						take: 50,
					}),
					db.rssSaved.findMany({
						where: { userId },
						orderBy: [{ savedAt: "desc" }, { id: "desc" }],
						skip: offset,
						take: 50,
					}),
					db.rssUnread.count({ where: { userId, feedId } }),
					db.rssSaved.count({ where: { userId } }),
				],
			);
			return {
				feeds: feeds.map(
					({ id, url, title, folder, lastFetchedAt, error }) => ({
						id,
						url,
						title,
						folder,
						lastFetchedAt: lastFetchedAt?.toISOString() ?? null,
						error,
					}),
				),
				unread: unread.map(
					({ id, feedId: source, url, title, publishedAt, receivedAt }) => ({
						id,
						feedId: source,
						url,
						title,
						publishedAt: publishedAt?.toISOString() ?? null,
						receivedAt: receivedAt.toISOString(),
					}),
				),
				saved: saved.map(({ id, url, title, publishedAt, savedAt }) => ({
					id,
					url,
					title,
					publishedAt: publishedAt?.toISOString() ?? null,
					savedAt: savedAt.toISOString(),
				})),
				unreadCount,
				savedCount,
			};
		},
		async subscribe(userId: string, input: FeedInput) {
			const { count } = await withTransactionRetry(() =>
				db.rssFeed.createMany({
					data: [{ ...input, userId, id: randomUUID() }],
					skipDuplicates: true,
				}),
			);
			return count > 0;
		},
		async unsubscribe(userId, id) {
			await withTransactionRetry(() =>
				db.rssFeed.deleteMany({ where: { userId, id } }),
			);
		},
		async read(userId, input) {
			await withTransactionRetry(() =>
				db.rssUnread.deleteMany({
					where: {
						userId,
						...(input.ids ? { id: { in: input.ids } } : {}),
						feedId: input.feedId,
						...(input.before
							? { receivedAt: { lte: new Date(input.before) } }
							: {}),
					},
				}),
			);
		},
		async save(userId: string, input: EntryInput) {
			const { count } = await withTransactionRetry(() =>
				db.rssSaved.createMany({
					data: [
						{
							url: input.url,
							title: input.title,
							publishedAt: input.publishedAt
								? new Date(input.publishedAt)
								: null,
							userId,
							id: randomUUID(),
							savedAt: new Date(),
						},
					],
					skipDuplicates: true,
				}),
			);
			return count > 0;
		},
		async unsave(userId, id) {
			await withTransactionRetry(() =>
				db.rssSaved.deleteMany({ where: { userId, id } }),
			);
		},
		async claim(userId, id, force) {
			const now = new Date();
			const token = randomUUID();
			return withTransactionRetry(() =>
				db.$transaction(async (tx) => {
					const result = await tx.rssFeed.updateMany({
						where: {
							userId,
							id,
							AND: [
								{
									OR: [
										{ leaseExpiresAt: null },
										{ leaseExpiresAt: { lt: now } },
									],
								},
								{
									OR: [
										{ lastFetchedAt: null },
										{
											lastFetchedAt: {
												lt: new Date(now.getTime() - (force ? 60000 : 3600000)),
											},
										},
									],
								},
							],
						},
						data: {
							leaseToken: token,
							leaseExpiresAt: new Date(now.getTime() + 60000),
						},
					});
					if (!result.count) return null;
					const feed = await tx.rssFeed.findFirstOrThrow({
						where: { id, userId },
					});
					return {
						...feed,
						token,
						lastFetchedAt: feed.lastFetchedAt?.toISOString() ?? null,
					};
				}),
			);
		},
		async complete(userId, lease, result) {
			await withTransactionRetry(() =>
				db.$transaction(async (tx) => {
					const now = new Date();
					const locked = await tx.rssFeed.updateMany({
						where: {
							id: lease.id,
							userId,
							leaseToken: lease.token,
							leaseExpiresAt: { gt: now },
						},
						data: {
							leaseToken: null,
							leaseExpiresAt: null,
							lastFetchedAt: now,
							error: null,
							...(result.notModified
								? {}
								: {
										etag: result.etag,
										lastModified: result.lastModified,
										title: result.title || lease.title,
									}),
						},
					});
					if (!locked.count || result.notModified) return;
					if (result.repairMetadata) {
						// Repair existing damaged titles only; never recreate read rows or overwrite custom titles.
						const titles = new Map(
							result.entries
								.filter((entry) => !entry.title.includes("\uFFFD"))
								.map((entry) => [entry.url, entry.title]),
						);
						const where = {
							userId,
							url: { in: [...titles.keys()] },
							title: { contains: "\uFFFD" },
						};
						const [unread, saved] = await Promise.all([
							tx.rssUnread.findMany({
								where: { ...where, feedId: lease.id },
								select: { id: true, url: true },
							}),
							tx.rssSaved.findMany({ where, select: { id: true, url: true } }),
						]);
						for (const row of unread) {
							const title = titles.get(row.url);
							if (title === undefined) continue;
							await tx.rssUnread.updateMany({
								where: {
									id: row.id,
									userId,
									feedId: lease.id,
									title: { contains: "\uFFFD" },
								},
								data: { title },
							});
						}
						for (const row of saved) {
							const title = titles.get(row.url);
							if (title === undefined) continue;
							await tx.rssSaved.updateMany({
								where: { id: row.id, userId, title: { contains: "\uFFFD" } },
								data: { title },
							});
						}
					}
					const unique = new Map(
						result.entries.map((entry) => [
							hash(entry.identity).toString("hex"),
							entry,
						]),
					);
					if (unique.size === 0) return;
					const known = await tx.rssSeen.findMany({
						where: {
							feedId: lease.id,
							hash: {
								in: [...unique.keys()].map((key) => Buffer.from(key, "hex")),
							},
						},
						select: { hash: true },
					});
					for (const row of known)
						unique.delete(Buffer.from(row.hash).toString("hex"));
					if (unique.size === 0) return;
					await tx.rssSeen.createMany({
						data: [...unique.keys()].map((key) => ({
							feedId: lease.id,
							hash: Buffer.from(key, "hex"),
						})),
					});
					await tx.rssUnread.createMany({
						data: [...unique.values()].map((entry) => ({
							url: entry.url,
							title: entry.title,
							id: randomUUID(),
							userId,
							feedId: lease.id,
							publishedAt: entry.publishedAt
								? new Date(entry.publishedAt)
								: null,
							receivedAt: now,
						})),
					});
				}),
			);
		},
		async fail(userId, lease) {
			await withTransactionRetry(() =>
				db.rssFeed.updateMany({
					where: { id: lease.id, userId, leaseToken: lease.token },
					data: {
						leaseToken: null,
						leaseExpiresAt: null,
						error: "FETCH_FAILED",
						lastFetchedAt: new Date(),
					},
				}),
			);
		},
	};
}

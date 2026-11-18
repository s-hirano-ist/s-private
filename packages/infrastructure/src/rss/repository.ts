import type { RssRepository } from "@s-hirano-ist/s-application/rss/ports";
import type {
	EntryInput,
	FeedInput,
	ParsedEntry,
} from "@s-hirano-ist/s-core/rss/types";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import {
	withTransactionRetry,
	type TransactionRetryResult,
} from "@s-hirano-ist/s-database";
import { needsTitleRepair } from "@s-hirano-ist/s-infrastructure/rss/title-repair";
import { createHash, randomUUID } from "node:crypto";
const hash = (identity: string) =>
	createHash("sha256").update(identity).digest();
export function createRssRepository(
	db: DatabaseClient,
	onRetryComplete?: (result: TransactionRetryResult) => void,
): RssRepository {
	const retry = <T>(work: () => Promise<T>) =>
		withTransactionRetry(work, { onComplete: onRetryComplete });
	return {
		async page(userId, offset, feedId, requestedView, snapshotRevision) {
			const view = requestedView ?? "all";
			return retry(() =>
				db.$transaction(async (tx) => {
					const current =
						(await tx.rssState.findUnique({ where: { userId } }))?.revision ??
						0;
					// A future client boundary must never include later, unobserved arrivals.
					const revision = Math.min(snapshotRevision ?? current, current);
					const includeUnread = view === "all" || view === "unread";
					const includeSaved = view === "all" || view === "saved";
					const unreadWhere = { userId, feedId, revision: { lte: revision } };
					const [unreadCount, savedCount, newerCount] = await Promise.all([
						includeUnread ? tx.rssUnread.count({ where: unreadWhere }) : 0,
						includeSaved ? tx.rssSaved.count({ where: { userId } }) : 0,
						includeUnread
							? tx.rssUnread.count({
									where: { userId, feedId, revision: { gt: revision } },
								})
							: 0,
					]);
					let total = unreadCount;
					if (view === "saved") total = savedCount;
					if (view === "all") total = Math.max(unreadCount, savedCount);
					const effectiveOffset = Math.min(
						offset,
						Math.max(0, Math.floor((total - 1) / 50) * 50),
					);
					const [feeds, unread, saved] = await Promise.all([
						tx.rssFeed.findMany({
							where: { userId },
							orderBy: [{ folder: "asc" }, { title: "asc" }, { id: "asc" }],
						}),
						includeUnread
							? tx.rssUnread.findMany({
									where: unreadWhere,
									orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
									skip: effectiveOffset,
									take: 50,
								})
							: [],
						includeSaved
							? tx.rssSaved.findMany({
									where: { userId },
									orderBy: [{ savedAt: "desc" }, { id: "desc" }],
									skip: effectiveOffset,
									take: 50,
								})
							: [],
					]);
					const stars =
						unread.length > 0
							? await tx.rssSaved.findMany({
									where: {
										userId,
										url: { in: unread.map((entry) => entry.url) },
									},
									select: { id: true, url: true },
								})
							: [];
					const savedIds = new Map(stars.map((entry) => [entry.url, entry.id]));
					return {
						snapshotRevision: revision,
						newerCount,
						offset: effectiveOffset,
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
							({
								id,
								feedId: source,
								url,
								title,
								imageUrl,
								publishedAt,
								receivedAt,
							}) => ({
								id,
								feedId: source,
								savedId: savedIds.get(url) ?? null,
								imageUrl: imageUrl ?? null,
								url,
								title,
								publishedAt: publishedAt?.toISOString() ?? null,
								receivedAt: receivedAt.toISOString(),
							}),
						),
						saved: saved.map(
							({ id, url, title, imageUrl, publishedAt, savedAt }) => ({
								imageUrl: imageUrl ?? null,
								id,
								url,
								title,
								publishedAt: publishedAt?.toISOString() ?? null,
								savedAt: savedAt.toISOString(),
							}),
						),
						unreadCount,
						savedCount,
					};
				}),
			);
		},
		due(now, limit) {
			return db.rssFeed.findMany({
				where: {
					AND: [
						{
							OR: [
								{ lastFetchedAt: null },
								{ lastFetchedAt: { lt: new Date(now.getTime() - 3600000) } },
							],
						},
						{ OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }] },
					],
				},
				orderBy: [
					{ lastFetchedAt: { sort: "asc", nulls: "first" } },
					{ id: "asc" },
				],
				take: limit,
				select: { id: true, userId: true },
			});
		},
		async subscribe(userId: string, input: FeedInput) {
			const { count } = await retry(() =>
				db.rssFeed.createMany({
					data: [{ ...input, userId, id: randomUUID() }],
					skipDuplicates: true,
				}),
			);
			return count > 0;
		},
		async unsubscribe(userId, id) {
			await retry(() => db.rssFeed.deleteMany({ where: { userId, id } }));
		},
		async read(userId, input) {
			await retry(() =>
				db.rssUnread.deleteMany({
					where: {
						userId,
						...(input.ids ? { id: { in: input.ids } } : {}),
						feedId: input.feedId,
						...(input.snapshotRevision === undefined
							? {}
							: { revision: { lte: input.snapshotRevision } }),
					},
				}),
			);
		},
		async save(userId: string, input: EntryInput) {
			return retry(() =>
				db.$transaction(async (tx) => {
					const { count } = await tx.rssSaved.createMany({
						data: [
							{
								url: input.url,
								title: input.title,
								imageUrl: input.imageUrl ?? null,
								publishedAt: input.publishedAt
									? new Date(input.publishedAt)
									: null,
								userId,
								id: randomUUID(),
								savedAt: new Date(),
							},
						],
						skipDuplicates: true,
					});
					const row = await tx.rssSaved.findFirstOrThrow({
						where: { userId, url: input.url },
					});
					return {
						added: count > 0,
						saved: {
							id: row.id,
							url: row.url,
							title: row.title,
							imageUrl: row.imageUrl,
							publishedAt: row.publishedAt?.toISOString() ?? null,
							savedAt: row.savedAt.toISOString(),
						},
					};
				}),
			);
		},
		async unsave(userId, id) {
			await retry(() => db.rssSaved.deleteMany({ where: { userId, id } }));
		},
		async claim(userId, id, force) {
			const now = new Date();
			const token = randomUUID();
			return retry(() =>
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
			return retry(() =>
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
					if (!locked.count) return false;
					const metadataChanged =
						Boolean(lease.error) ||
						(!result.notModified &&
							Boolean(result.title) &&
							result.title !== lease.title);
					if (result.notModified) return metadataChanged;
					if (result.repairMetadata) {
						await fillMissingImages(tx, userId, lease.id, result.entries);

						// Repair existing damaged titles only; never recreate read rows or overwrite custom titles.
						const titles = new Map(
							result.entries
								.filter((entry) => !entry.title.includes("\uFFFD"))
								.map((entry) => [entry.url, entry.title]),
						);
						const where = {
							userId,
							url: { in: [...titles.keys()] },
						};
						const [unread, saved] = await Promise.all([
							tx.rssUnread.findMany({
								where: { ...where, feedId: lease.id },
								select: { id: true, url: true, title: true },
							}),
							tx.rssSaved.findMany({
								where,
								select: { id: true, url: true, title: true },
							}),
						]);
						for (const row of unread) {
							const title = titles.get(row.url);
							if (title === undefined || !needsTitleRepair(row.title, title))
								continue;
							await tx.rssUnread.updateMany({
								where: {
									id: row.id,
									userId,
									feedId: lease.id,
									title: row.title,
								},
								data: { title },
							});
						}
						for (const row of saved) {
							const title = titles.get(row.url);
							if (title === undefined || !needsTitleRepair(row.title, title))
								continue;
							await tx.rssSaved.updateMany({
								where: { id: row.id, userId, title: row.title },
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
					if (unique.size === 0)
						return metadataChanged || Boolean(result.repairMetadata);
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
					if (unique.size === 0)
						return metadataChanged || Boolean(result.repairMetadata);
					await tx.rssSeen.createMany({
						data: [...unique.keys()].map((key) => ({
							feedId: lease.id,
							hash: Buffer.from(key, "hex"),
						})),
					});
					const state = await tx.rssState.upsert({
						where: { userId },
						create: { userId, revision: 1 },
						update: { revision: { increment: 1 } },
					});
					await tx.rssUnread.createMany({
						data: [...unique.values()].map((entry) => ({
							url: entry.url,
							title: entry.title,
							imageUrl: entry.imageUrl ?? null,
							id: randomUUID(),
							userId,
							feedId: lease.id,
							publishedAt: entry.publishedAt
								? new Date(entry.publishedAt)
								: null,
							receivedAt: now,
							revision: state.revision,
						})),
					});
					return true;
				}),
			);
		},
		async fail(userId, lease) {
			await retry(() =>
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

async function fillMissingImages(
	tx: Pick<DatabaseClient, "rssUnread" | "rssSaved">,
	userId: string,
	feedId: string,
	entries: ParsedEntry[],
) {
	const images = new Map(
		entries
			.filter((entry) => entry.imageUrl)
			.map((entry) => [entry.url, entry.imageUrl]),
	);
	const imageWhere = {
		userId,
		url: { in: [...images.keys()] },
		imageUrl: null,
	};
	const [unreadImages, savedImages] = await Promise.all([
		tx.rssUnread.findMany({
			where: { ...imageWhere, feedId: feedId },
			select: { id: true, url: true },
		}),
		tx.rssSaved.findMany({
			where: imageWhere,
			select: { id: true, url: true },
		}),
	]);
	for (const row of unreadImages) {
		const imageUrl = images.get(row.url);
		if (!imageUrl) continue;
		await tx.rssUnread.updateMany({
			where: { id: row.id, userId, feedId: feedId, imageUrl: null },
			data: { imageUrl },
		});
	}
	for (const row of savedImages) {
		const imageUrl = images.get(row.url);
		if (!imageUrl) continue;
		await tx.rssSaved.updateMany({
			where: { id: row.id, userId, imageUrl: null },
			data: { imageUrl },
		});
	}
}

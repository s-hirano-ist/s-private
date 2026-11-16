import type {
	FeedLease,
	FeedResult,
} from "@s-hirano-ist/s-application/rss/ports";
import { PrismaClient, PrismaPg } from "@s-hirano-ist/s-database";
import { extendDatabase } from "@s-hirano-ist/s-infrastructure/database";
import { createRssRepository } from "@s-hirano-ist/s-infrastructure/rss/repository";
import { tenantContext } from "@s-hirano-ist/s-infrastructure/shared/tenant-context";
import { applyTenantFilter } from "@s-hirano-ist/s-infrastructure/shared/tenant-filter";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
const connectionString = process.env.RSS_TEST_DATABASE_URL;
const client = new PrismaClient({
	adapter: new PrismaPg({
		connectionString:
			connectionString ??
			"postgresql://root@localhost:26257/rss_worktree_410f?sslmode=disable",
	}),
});
const db = extendDatabase(
	client,
	(model, operation, args) =>
		applyTenantFilter(model, operation, args, tenantContext.getStore()),
	() => {},
);
const rss = createRssRepository(db);
const owner = "rss-integration-owner";
const asOwner = <T>(work: () => Promise<T>) =>
	tenantContext.run({ userId: owner }, work);
const source = {
	url: "https://example.com/feed",
	title: "Feed",
	folder: "Tech",
};
const result: FeedResult = {
	title: "Feed",
	notModified: false,
	etag: "v1",
	lastModified: null,
	entries: [
		{
			identity: "stable-guid",
			url: "https://example.com/one",
			title: "One",
			publishedAt: null,
		},
	],
};
async function ownedLease(): Promise<FeedLease> {
	const feed = (await rss.page(owner, 0)).feeds[0];
	await client.rssFeed.update({
		where: { id: feed.id },
		data: { lastFetchedAt: null },
	});
	const lease = await asOwner(() => rss.claim(owner, feed.id, false));
	if (!lease) throw new Error("Missing lease");
	return lease;
}
describe.skipIf(!connectionString)("RSS CockroachDB integration", () => {
	beforeAll(async () => {
		if (
			!new URL(connectionString!).pathname.startsWith("/rss_worktree_") ||
			!["localhost", "127.0.0.1"].includes(new URL(connectionString!).hostname)
		)
			throw new Error("Use a dedicated RSS test database");
		await client.rssFeed.deleteMany({ where: { userId: owner } });
		await client.rssSaved.deleteMany({ where: { userId: owner } });
	});
	afterAll(async () => {
		await client.rssFeed.deleteMany({ where: { userId: owner } });
		await client.rssSaved.deleteMany({ where: { userId: owner } });
		await client.$disconnect();
	});
	test("duplicate subscriptions, concurrent leases, and owner isolation", async () => {
		expect(await asOwner(() => rss.subscribe(owner, source))).toBe(true);
		expect(await asOwner(() => rss.subscribe(owner, source))).toBe(false);
		const lease = await ownedLease();
		expect(await asOwner(() => rss.claim(owner, lease.id, true))).toBeNull();
		expect(
			await tenantContext.run({ userId: "other" }, () =>
				rss.claim("other", lease.id, true),
			),
		).toBeNull();
		await asOwner(() => rss.complete(owner, lease, result));
		expect((await rss.page("other", 0)).unread).toEqual([]);
	});
	test("reading deletes metadata but refetching reordered or changed items never resurrects it", async () => {
		const page = await rss.page(owner, 0);
		expect(page.unreadCount).toBe(1);
		await asOwner(() => rss.save(owner, page.unread[0]));
		await tenantContext.run({ userId: "other" }, () =>
			rss.read("other", { ids: [page.unread[0].id] }),
		);
		expect((await rss.page(owner, 0)).unreadCount).toBe(1);
		await asOwner(() => rss.read(owner, { ids: [page.unread[0].id] }));
		const lease = await ownedLease();
		await asOwner(() =>
			rss.complete(owner, lease, {
				...result,
				entries: [
					{
						...result.entries[0],
						title: "Changed",
						publishedAt: "2020-01-01T00:00:00.000Z",
					},
					result.entries[0],
				],
			}),
		);
		expect((await rss.page(owner, 0)).unreadCount).toBe(0);
		expect((await rss.page(owner, 0)).savedCount).toBe(1);
		expect(await client.rssSeen.count()).toBe(1);
	});
	test("stale lease cannot commit after recovery, failure preserves entries and validators", async () => {
		const stale = await ownedLease();
		await client.rssFeed.update({
			where: { id: stale.id },
			data: { leaseExpiresAt: new Date(0) },
		});
		const current = await ownedLease();
		await asOwner(() =>
			rss.complete(owner, stale, {
				...result,
				entries: [{ ...result.entries[0], identity: "stale" }],
			}),
		);
		expect((await rss.page(owner, 0)).unreadCount).toBe(0);
		await asOwner(() => rss.fail(owner, current));
		expect((await rss.page(owner, 0)).feeds[0].error).toBe("FETCH_FAILED");
		expect(
			(await client.rssFeed.findUniqueOrThrow({ where: { id: stale.id } }))
				.etag,
		).toBe("v1");
	});
	test("unsubscription cascades receipts and unread while saved links survive; saves deduplicate", async () => {
		const lease = await ownedLease();
		await asOwner(() =>
			rss.complete(owner, lease, {
				...result,
				entries: [{ ...result.entries[0], identity: "new" }],
			}),
		);
		const page = await rss.page(owner, 0);
		expect(await asOwner(() => rss.save(owner, page.unread[0]))).toBe(false);
		await tenantContext.run({ userId: "other" }, () =>
			rss.unsubscribe("other", lease.id),
		);
		expect((await rss.page(owner, 0)).feeds).toHaveLength(1);
		await asOwner(() => rss.unsubscribe(owner, lease.id));
		expect(await rss.page(owner, 0)).toMatchObject({
			feeds: [],
			unread: [],
			savedCount: 1,
		});
		expect(await client.rssSeen.count()).toBe(0);
		await asOwner(() => rss.unsave(owner, page.saved[0].id));
		expect((await rss.page(owner, 0)).savedCount).toBe(0);
	});
	test("manual refresh repairs existing unread and saved titles without restoring read articles", async () => {
		await asOwner(() => rss.subscribe(owner, source));
		const first = await ownedLease();
		await asOwner(() =>
			rss.complete(owner, first, {
				...result,
				entries: [{ ...result.entries[0], title: "\uFFFD\uFFFD" }],
			}),
		);
		const before = await rss.page(owner, 0);
		await asOwner(() => rss.save(owner, before.unread[0]));
		const correction = {
			...result,
			repairMetadata: true,
			entries: [{ ...result.entries[0], title: "日本語" }],
		};
		const second = await ownedLease();
		await asOwner(() => rss.complete(owner, second, correction));
		const after = await rss.page(owner, 0);
		expect(after.unread).toHaveLength(1);
		expect(after.unread[0]).toMatchObject({
			id: before.unread[0].id,
			title: "日本語",
		});
		expect(after.saved[0].title).toBe("日本語");
		await asOwner(() => rss.read(owner, { ids: [after.unread[0].id] }));
		const third = await ownedLease();
		await asOwner(() => rss.complete(owner, third, correction));
		expect((await rss.page(owner, 0)).unreadCount).toBe(0);
	});
	test("manual repair fixes CNET-style Western mojibake while preserving normal titles and other owners", async () => {
		const title =
			"「iPhone Duo」耐久テスト、45万回超の開閉でヒンジに異変　完全に開かず";
		const url = "https://japan.cnet.com/article/35254934/";
		const entry = { identity: url, url, title, publishedAt: null };
		const damaged = new TextDecoder("windows-1252").decode(Buffer.from(title));
		expect(damaged).not.toContain("\uFFFD");
		const first = await ownedLease();
		await asOwner(() =>
			rss.complete(owner, first, {
				...result,
				entries: [
					{ ...entry, title: damaged },
					{
						...entry,
						url: `${url}?custom`,
						identity: "custom",
						title: "自分のタイトル",
					},
				],
			}),
		);
		await asOwner(() => rss.save(owner, { ...entry, title: damaged }));
		await tenantContext.run({ userId: "rss-repair-other" }, () =>
			rss.save("rss-repair-other", { ...entry, title: damaged }),
		);
		try {
			const before = await rss.page(owner, 0);
			const second = await ownedLease();
			await asOwner(() =>
				rss.complete(owner, second, {
					...result,
					repairMetadata: true,
					entries: [
						entry,
						{ ...entry, url: `${url}?custom`, identity: "custom" },
					],
				}),
			);
			const after = await rss.page(owner, 0);
			expect(after.unread.find((row) => row.url === url)).toMatchObject({
				title,
				id: before.unread.find((row) => row.url === url)?.id,
			});
			expect(after.saved.find((row) => row.url === url)?.title).toBe(title);
			expect(
				after.unread.find((row) => row.url.endsWith("?custom"))?.title,
			).toBe("自分のタイトル");
			expect((await rss.page("rss-repair-other", 0)).saved[0].title).toBe(
				damaged,
			);
			const repaired = after.unread.find((row) => row.url === url)!;
			await asOwner(() => rss.read(owner, { ids: [repaired.id] }));
			const third = await ownedLease();
			await asOwner(() =>
				rss.complete(owner, third, {
					...result,
					repairMetadata: true,
					entries: [entry],
				}),
			);
			expect(
				(await rss.page(owner, 0)).unread.some((row) => row.url === url),
			).toBe(false);
		} finally {
			await client.rssSaved.deleteMany({
				where: { userId: "rss-repair-other" },
			});
		}
	});
});

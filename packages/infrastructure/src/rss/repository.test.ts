import type {
	FeedLease,
	FeedResult,
} from "@s-hirano-ist/s-application/rss/ports";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import { createRssRepository } from "@s-hirano-ist/s-infrastructure/rss/repository";
import { createHash } from "node:crypto";
import { expect, test, vi } from "vitest";
function fixture() {
	const model = () => ({
		findMany: vi.fn().mockResolvedValue([]),
		count: vi.fn().mockResolvedValue(0),
		createMany: vi.fn().mockResolvedValue({ count: 1 }),
		deleteMany: vi.fn(),
		updateMany: vi.fn().mockResolvedValue({ count: 1 }),
		findFirstOrThrow: vi.fn(),
	});
	const db = {
		rssFeed: model(),
		rssUnread: model(),
		rssSaved: model(),
		rssSeen: model(),
		$transaction: vi.fn(),
	};
	db.$transaction.mockImplementation((work) => work(db));
	return { db, rss: createRssRepository(db as unknown as DatabaseClient) };
}
const lease: FeedLease = {
	id: "feed",
	token: "lease",
	url: "https://example.com/feed",
	title: "News",
	folder: "",
	error: null,
	lastFetchedAt: null,
	etag: null,
	lastModified: null,
};
const result: FeedResult = {
	notModified: false,
	title: "Updated",
	etag: "v1",
	lastModified: null,
	entries: [
		{
			identity: "one",
			url: "https://example.com/one",
			title: "One",
			publishedAt: null,
		},
	],
};
test("page scopes every query and serializes dates while keeping saved links independent of feed filters", async () => {
	const { db, rss } = fixture();
	const date = new Date("2026-11-15T00:00:00Z");
	db.rssFeed.findMany.mockResolvedValue([
		{ ...lease, lastFetchedAt: date },
		lease,
	]);
	db.rssUnread.findMany.mockResolvedValue([
		{ ...result.entries[0], id: "one", feedId: "feed", receivedAt: date },
		{
			...result.entries[0],
			id: "two",
			feedId: "feed",
			publishedAt: date,
			receivedAt: date,
		},
	]);
	db.rssSaved.findMany.mockResolvedValue([
		{ ...result.entries[0], id: "saved", savedAt: date },
		{ ...result.entries[0], id: "saved2", savedAt: date, publishedAt: date },
	]);
	const page = await rss.page("owner", 50, "feed");
	expect(page.feeds.map((f) => f.lastFetchedAt)).toEqual([
		date.toISOString(),
		null,
	]);
	expect(page.unread.map((e) => e.publishedAt)).toEqual([
		null,
		date.toISOString(),
	]);
	expect(page.saved.map((e) => e.publishedAt)).toEqual([
		null,
		date.toISOString(),
	]);
	expect(db.rssUnread.findMany).toHaveBeenCalledWith(
		expect.objectContaining({
			where: { userId: "owner", feedId: "feed" },
			skip: 50,
			take: 50,
		}),
	);
	expect(db.rssSaved.findMany).toHaveBeenCalledWith(
		expect.objectContaining({ where: { userId: "owner" } }),
	);
});
test("read deletes only the selected ids or the bounded feed snapshot", async () => {
	const { db, rss } = fixture();
	await rss.read("owner", { ids: ["one"] });
	expect(db.rssUnread.deleteMany).toHaveBeenLastCalledWith({
		where: { userId: "owner", feedId: undefined, id: { in: ["one"] } },
	});
	const before = "2026-11-15T00:00:00Z";
	await rss.read("owner", { feedId: "feed", before });
	expect(db.rssUnread.deleteMany).toHaveBeenLastCalledWith({
		where: {
			userId: "owner",
			feedId: "feed",
			receivedAt: { lte: new Date(before) },
		},
	});
});
test("subscriptions and saved metadata deduplicate, and removals retain owner predicates", async () => {
	const { db, rss } = fixture();
	const input = { url: lease.url, title: lease.title, folder: "Tech" };
	expect(await rss.subscribe("owner", input)).toBe(true);
	db.rssFeed.createMany.mockResolvedValue({ count: 0 });
	expect(await rss.subscribe("owner", input)).toBe(false);
	await rss.unsubscribe("owner", lease.id);
	expect(db.rssFeed.deleteMany).toHaveBeenCalledWith({
		where: { userId: "owner", id: lease.id },
	});
	expect(await rss.save("owner", result.entries[0])).toBe(true);
	await rss.save("owner", {
		...result.entries[0],
		publishedAt: "2026-01-01T00:00:00Z",
	});
	expect(db.rssSaved.createMany).toHaveBeenLastCalledWith(
		expect.objectContaining({
			skipDuplicates: true,
			data: [
				expect.objectContaining({
					userId: "owner",
					publishedAt: new Date("2026-01-01T00:00:00Z"),
				}),
			],
		}),
	);
	await rss.unsave("owner", "saved");
	expect(db.rssSaved.deleteMany).toHaveBeenCalledWith({
		where: { userId: "owner", id: "saved" },
	});
});
test("claim atomically enforces lease and poll windows", async () => {
	const { db, rss } = fixture();
	db.rssFeed.findFirstOrThrow.mockResolvedValue(lease);
	const claimed = await rss.claim("owner", "feed", false);
	expect(claimed).toMatchObject({
		id: "feed",
		lastFetchedAt: null,
		token: expect.any(String),
	});
	const first = db.rssFeed.updateMany.mock.calls[0][0];
	const normalThreshold = first.where.AND[1].OR[1].lastFetchedAt.lt.getTime();
	const now = first.where.AND[0].OR[1].leaseExpiresAt.lt.getTime();
	expect(now - normalThreshold).toBe(3600000);
	db.rssFeed.findFirstOrThrow.mockResolvedValue({
		...lease,
		lastFetchedAt: new Date(0),
	});
	expect(await rss.claim("owner", "feed", true)).toMatchObject({
		lastFetchedAt: new Date(0).toISOString(),
	});
	const forced = db.rssFeed.updateMany.mock.calls[1][0];
	expect(
		forced.where.AND[0].OR[1].leaseExpiresAt.lt.getTime() -
			forced.where.AND[1].OR[1].lastFetchedAt.lt.getTime(),
	).toBe(60000);
	db.rssFeed.updateMany.mockResolvedValue({ count: 0 });
	expect(await rss.claim("other", "feed", false)).toBeNull();
});
test("completion stores only new identity hashes and metadata, atomically with lease ownership", async () => {
	const { db, rss } = fixture();
	const known = createHash("sha256").update("one").digest();
	db.rssSeen.findMany.mockResolvedValue([{ hash: known }]);
	await rss.complete("owner", lease, {
		...result,
		entries: [
			...result.entries,
			{
				...result.entries[0],
				identity: "two",
				publishedAt: "2026-01-01T00:00:00Z",
			},
			{ ...result.entries[0], identity: "three" },
		],
	});
	expect(db.rssFeed.updateMany).toHaveBeenCalledWith(
		expect.objectContaining({
			where: expect.objectContaining({
				userId: "owner",
				leaseToken: "lease",
				leaseExpiresAt: { gt: expect.any(Date) },
			}),
		}),
	);
	expect(db.rssSeen.createMany.mock.calls[0][0].data).toHaveLength(2);
	expect(db.rssUnread.createMany.mock.calls[0][0].data).toEqual([
		expect.objectContaining({
			userId: "owner",
			publishedAt: new Date("2026-01-01T00:00:00Z"),
		}),
		expect.objectContaining({ publishedAt: null }),
	]);
	expect(db.rssUnread.createMany.mock.calls[0][0].data[0]).not.toHaveProperty(
		"identity",
	);
});
test("stale leases, 304, empty feeds and already-seen items cannot create unread entries", async () => {
	const { db, rss } = fixture();
	db.rssFeed.updateMany.mockResolvedValueOnce({ count: 0 });
	await rss.complete("owner", lease, result);
	await rss.complete("owner", lease, { ...result, notModified: true });
	await rss.complete("owner", lease, { ...result, entries: [] });
	db.rssSeen.findMany.mockResolvedValue([
		{ hash: createHash("sha256").update("one").digest() },
	]);
	await rss.complete("owner", lease, { ...result, title: "" });
	expect(db.rssUnread.createMany).not.toHaveBeenCalled();
	expect(db.rssSeen.createMany).not.toHaveBeenCalled();
	await rss.fail("owner", lease);
	expect(db.rssFeed.updateMany).toHaveBeenLastCalledWith({
		where: { id: "feed", userId: "owner", leaseToken: "lease" },
		data: expect.objectContaining({
			error: "FETCH_FAILED",
			leaseToken: null,
			leaseExpiresAt: null,
		}),
	});
});

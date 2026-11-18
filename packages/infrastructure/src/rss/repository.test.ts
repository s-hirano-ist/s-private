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
		rssState: {
			findUnique: vi.fn().mockResolvedValue({ revision: 0 }),
			upsert: vi.fn().mockResolvedValue({ revision: 1 }),
		},
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
	db.rssUnread.count.mockResolvedValue(100);
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
			where: { userId: "owner", feedId: "feed", revision: { lte: 0 } },
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
	const snapshotRevision = 7;
	await rss.read("owner", { feedId: "feed", snapshotRevision });
	expect(db.rssUnread.deleteMany).toHaveBeenLastCalledWith({
		where: {
			userId: "owner",
			feedId: "feed",
			revision: { lte: snapshotRevision },
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
	db.rssSaved.findFirstOrThrow.mockResolvedValue({
		...result.entries[0],
		id: "saved",
		savedAt: new Date(0),
	});
	expect(await rss.save("owner", result.entries[0])).toMatchObject({
		added: true,
		saved: { id: "saved", savedAt: new Date(0).toISOString() },
	});
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

test("manual repair corrects damaged existing titles without resurrecting read entries", async () => {
	const { db, rss } = fixture();
	db.rssSeen.findMany.mockResolvedValue([
		{ hash: createHash("sha256").update("one").digest() },
	]);
	db.rssUnread.findMany.mockResolvedValue([
		{ id: "unread", url: result.entries[0].url, title: "\uFFFD" },
	]);
	db.rssSaved.findMany.mockResolvedValue([
		{ id: "saved", url: result.entries[0].url, title: "\uFFFD" },
	]);
	await rss.complete("owner", lease, { ...result, repairMetadata: true });
	expect(db.rssUnread.findMany).toHaveBeenCalledWith({
		where: {
			userId: "owner",
			feedId: "feed",
			url: { in: [result.entries[0].url] },
		},
		select: { id: true, url: true, title: true },
	});
	expect(db.rssUnread.updateMany).toHaveBeenCalledWith({
		where: {
			id: "unread",
			userId: "owner",
			feedId: "feed",
			title: "\uFFFD",
		},
		data: { title: "One" },
	});
	expect(db.rssSaved.updateMany).toHaveBeenCalledWith({
		where: { id: "saved", userId: "owner", title: "\uFFFD" },
		data: { title: "One" },
	});
	expect(db.rssUnread.createMany).not.toHaveBeenCalled();
});

test("view-specific reads omit hidden lists and empty unread pages omit star lookup", async () => {
	const { db, rss } = fixture();
	await rss.page("owner", 0, undefined, "saved");
	expect(db.rssUnread.findMany).not.toHaveBeenCalled();
	expect(db.rssSaved.findMany).toHaveBeenCalledTimes(1);
	db.rssSaved.findMany.mockClear();
	await rss.page("owner", 0, undefined, "unread");
	expect(db.rssSaved.findMany).not.toHaveBeenCalled();
	db.rssUnread.findMany.mockClear();
	db.rssUnread.count.mockClear();
	db.rssSaved.count.mockClear();
	await rss.page("owner", 0, undefined, "feeds");
	expect(db.rssUnread.findMany).not.toHaveBeenCalled();
	expect(db.rssSaved.findMany).not.toHaveBeenCalled();
	expect(db.rssUnread.count).not.toHaveBeenCalled();
	expect(db.rssSaved.count).not.toHaveBeenCalled();
});
test("scheduled selection excludes fresh or leased feeds and orders the oldest attempts first", async () => {
	const { db, rss } = fixture();
	const now = new Date("2026-11-17T01:00:00Z");
	await rss.due(now, 100);
	expect(db.rssFeed.findMany).toHaveBeenCalledWith({
		where: {
			AND: [
				{
					OR: [
						{ lastFetchedAt: null },
						{ lastFetchedAt: { lt: new Date("2026-11-17T00:00:00Z") } },
					],
				},
				{ OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }] },
			],
		},
		orderBy: [
			{ lastFetchedAt: { sort: "asc", nulls: "first" } },
			{ id: "asc" },
		],
		take: 100,
		select: { id: true, userId: true },
	});
});
test("completion reports whether article or visible metadata changed", async () => {
	const { db, rss } = fixture();
	expect(
		await rss.complete("owner", lease, { ...result, notModified: true }),
	).toBe(false);
	expect(
		await rss.complete(
			"owner",
			{ ...lease, error: "FETCH_FAILED" },
			{ ...result, notModified: true },
		),
	).toBe(true);
	db.rssSeen.findMany.mockResolvedValue([
		{ hash: createHash("sha256").update("one").digest() },
	]);
	expect(
		await rss.complete("owner", lease, { ...result, title: lease.title }),
	).toBe(false);
	expect(
		await rss.complete("owner", lease, { ...result, title: "Renamed" }),
	).toBe(true);
});

test("saving an already saved URL returns the original row without overwriting its metadata", async () => {
	const { db, rss } = fixture();
	db.rssSaved.createMany.mockResolvedValue({ count: 0 });
	const existing = {
		id: "original",
		url: result.entries[0].url,
		title: "Original title",
		imageUrl: null,
		publishedAt: null,
		savedAt: new Date(0),
	};
	db.rssSaved.findFirstOrThrow.mockResolvedValue(existing);
	expect(await rss.save("owner", result.entries[0])).toEqual({
		added: false,
		saved: { ...existing, savedAt: new Date(0).toISOString() },
	});
	expect(db.rssSaved.findFirstOrThrow).toHaveBeenCalledWith({
		where: { userId: "owner", url: result.entries[0].url },
	});
});

test("a recovered page transaction records retry telemetry and returns the successful result", async () => {
	const { db } = fixture();
	db.$transaction.mockRejectedValueOnce({ code: "P2034" });
	const observed = vi.fn();
	const rss = createRssRepository(db as unknown as DatabaseClient, observed);
	expect(await rss.page("owner", 0)).toMatchObject({ unreadCount: 0 });
	expect(db.$transaction).toHaveBeenCalledTimes(2);
	expect(observed).toHaveBeenCalledExactlyOnceWith({
		retries: 1,
		durationMs: expect.any(Number),
		outcome: "recovered",
	});
});

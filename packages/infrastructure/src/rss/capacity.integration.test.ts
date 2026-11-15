import { PrismaClient, PrismaPg } from "@s-hirano-ist/s-database";
import { createHash, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";
const connectionString = process.env.RSS_CAPACITY_DATABASE_URL;
async function saveReport(value: unknown) {
	if (process.env.RSS_CAPACITY_REPORT)
		await writeFile(
			process.env.RSS_CAPACITY_REPORT,
			JSON.stringify(value, null, 2),
		);
}
async function measure() {
	if (
		!connectionString ||
		!new URL(connectionString).pathname.startsWith("/rss_worktree_") ||
		!["localhost", "127.0.0.1"].includes(new URL(connectionString).hostname)
	)
		throw new Error("Use a dedicated RSS test database");
	const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
	const owner = "rss-capacity-owner";
	const feeds = Array.from({ length: 100 }, (_, index) => ({
		id: randomUUID(),
		userId: owner,
		url: `https://example.com/feed/${index}`,
		title: `Feed ${index}`,
		folder: "Technology",
	}));
	const entries = Array.from({ length: 10000 }, (_, index) => ({
		id: randomUUID(),
		userId: owner,
		feedId: feeds[index % 100].id,
		title: `Article ${index} 日本語のタイトルを含むRSS記事の保存容量測定`,
		url: `https://example.com/articles/${index}?source=rss&category=technology`,
		publishedAt: new Date(),
		receivedAt: new Date(),
	}));
	try {
		await db.rssFeed.createMany({ data: feeds });
		for (let offset = 0; offset < entries.length; offset += 500) {
			const batch = entries.slice(offset, offset + 500);
			await db.rssUnread.createMany({ data: batch });
			await db.rssSaved.createMany({
				data: batch.map((entry) => ({
					id: randomUUID(),
					userId: owner,
					url: entry.url,
					title: entry.title,
					publishedAt: entry.publishedAt,
					savedAt: entry.receivedAt,
				})),
			});
			await db.rssSeen.createMany({
				data: batch.map((entry) => ({
					feedId: entry.feedId,
					hash: createHash("sha256").update(entry.id).digest(),
				})),
			});
		}
		const counts = {
			feeds: await db.rssFeed.count({ where: { userId: owner } }),
			unread: await db.rssUnread.count({ where: { userId: owner } }),
			saved: await db.rssSaved.count({ where: { userId: owner } }),
		};
		type Range = {
			range_id: bigint;
			range_size: bigint;
			span_stats: { approximate_disk_bytes?: number };
		};
		const ranges = await Promise.all([
			db.$queryRaw<Range[]>`SHOW RANGES FROM TABLE rss_feeds WITH DETAILS`,
			db.$queryRaw<Range[]>`SHOW RANGES FROM TABLE rss_unread WITH DETAILS`,
			db.$queryRaw<Range[]>`SHOW RANGES FROM TABLE rss_saved WITH DETAILS`,
			db.$queryRaw<Range[]>`SHOW RANGES FROM TABLE rss_seen WITH DETAILS`,
		]);
		const unique = new Map(
			ranges.flat().map((range) => [String(range.range_id), range]),
		);
		return {
			counts,
			rangeBytes: [...unique.values()].reduce(
				(sum, range) => sum + Number(range.range_size),
				0,
			),
			approximateDiskBytes: [...unique.values()].reduce(
				(sum, range) => sum + (range.span_stats.approximate_disk_bytes ?? 0),
				0,
			),
		};
	} finally {
		await db.rssFeed.deleteMany({ where: { userId: owner } });
		await db.rssSaved.deleteMany({ where: { userId: owner } });
		await db.$disconnect();
	}
}
describe.skipIf(!connectionString)("RSS capacity measurement", () => {
	test("stores 100 subscriptions, 10000 unread and 10000 saved metadata records", async () => {
		const measured = await measure();
		expect(measured.counts).toEqual({
			feeds: 100,
			unread: 10000,
			saved: 10000,
		});
		await saveReport(measured);
		expect(measured.rangeBytes).toBeLessThan(256 * 1024 * 1024);
	}, 120000);
});

import { PrismaClient, PrismaPg } from "@s-hirano-ist/s-database";
import { extendDatabase } from "@s-hirano-ist/s-infrastructure/database";
import { createRssRepository } from "@s-hirano-ist/s-infrastructure/rss/repository";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";

const connectionString = process.env.RSS_PERFORMANCE_DATABASE_URL;
function localDatabaseUrl() {
	if (
		!connectionString ||
		!["localhost", "127.0.0.1"].includes(new URL(connectionString).hostname) ||
		!new URL(connectionString).pathname.startsWith("/rss_worktree_")
	)
		throw new Error("Use a dedicated RSS test database");
	return connectionString;
}
async function saveReport(value: unknown) {
	if (process.env.RSS_PERFORMANCE_REPORT)
		await writeFile(
			process.env.RSS_PERFORMANCE_REPORT,
			JSON.stringify(value, null, 2),
		);
}

describe.skipIf(!connectionString)("RSS page performance", () => {
	test("measures 100 feeds, 10000 unread and 10000 saved using a dedicated local database", async () => {
		const databaseUrl = localDatabaseUrl();
		const client = new PrismaClient({
			adapter: new PrismaPg({ connectionString: databaseUrl, max: 3 }),
			log: [{ emit: "event", level: "query" }],
		});
		let queries = 0;
		client.$on("query", () => queries++);
		const db = extendDatabase(
			client,
			(_model, _operation, args) => args,
			() => {},
		);
		const rss = createRssRepository(db);
		const userId = "rss-performance-owner";
		const feeds = Array.from({ length: 100 }, (_, i) => ({
			id: randomUUID(),
			userId,
			url: `https://example.com/feed/${i}`,
			title: `Feed ${i}`,
			folder: "Tech",
		}));
		const receivedAt = new Date("2026-11-17T00:00:00Z");
		try {
			await client.rssFeed.createMany({ data: feeds });
			for (let offset = 0; offset < 10000; offset += 500) {
				const entries = Array.from({ length: 500 }, (_, i) => ({
					id: randomUUID(),
					userId,
					feedId: feeds[(offset + i) % 100].id,
					url: `https://example.com/article/${offset + i}`,
					title: `Article ${offset + i} 日本語の性能測定`,
					receivedAt,
				}));
				await client.rssUnread.createMany({ data: entries });
				await client.rssSaved.createMany({
					data: entries.map(
						({ feedId: _feedId, receivedAt: savedAt, ...entry }) =>
							Object.assign(entry, { id: randomUUID(), savedAt }),
					),
				});
			}
			const report = [];
			for (const [name, offset, feedId] of [
				["first", 0, undefined],
				["next", 50, undefined],
				["filtered", 0, feeds[0].id],
			] as const) {
				await rss.page(userId, offset, feedId, "unread");
				const durations = [];
				const startQueries = queries;
				let bytes = 0;
				for (let i = 0; i < 20; i++) {
					const start = performance.now();
					const page = await rss.page(userId, offset, feedId, "unread");
					durations.push(performance.now() - start);
					bytes = Buffer.byteLength(JSON.stringify(page));
					expect(page.unread).toHaveLength(50);
				}
				durations.sort((a, b) => a - b);
				report.push({
					name,
					p50Ms: durations[9],
					p95Ms: durations[18],
					queriesPerRead: (queries - startQueries) / 20,
					bytes,
				});
			}
			const plan =
				await client.$queryRaw`EXPLAIN SELECT id FROM rss_unread WHERE user_id = ${userId} AND feed_id = ${feeds[0].id}::UUID ORDER BY received_at DESC, id DESC LIMIT 50`;
			await saveReport({ report, plan });
		} finally {
			await client.rssFeed.deleteMany({ where: { userId } });
			await client.rssSaved.deleteMany({ where: { userId } });
			await client.$disconnect();
		}
	}, 120000);
});

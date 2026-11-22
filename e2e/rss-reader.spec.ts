import { expect, test } from "@playwright/test";
import { PrismaClient, PrismaPg } from "@s-hirano-ist/s-database";
import { createHash, randomUUID } from "node:crypto";
const url = process.env.RSS_TEST_DATABASE_URL;
const enabled = !!url && process.env.LOCAL_DEV_MODE === "true";
function localDatabase() {
	if (
		!url ||
		!["localhost", "127.0.0.1"].includes(new URL(url).hostname) ||
		!new URL(url).pathname.startsWith("/rss_worktree_")
	)
		throw new Error("Use a dedicated local RSS test database");
	return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}
test.describe("RSS reader", () => {
	test.skip(
		!enabled,
		"Requires the local RSS backend and dedicated migrated DB",
	);
	test("reuses SSR data and automatically appends articles before resetting the filter", async ({
		page,
	}) => {
		const db = localDatabase();
		await page.request.get("/api/sign-in", { maxRedirects: 0 });
		const owner = await db.user.findUniqueOrThrow({
			where: { email: process.env.LOCAL_AUTH_EMAIL },
		});
		const feedIds = [randomUUID(), randomUUID()];
		const now = new Date();
		const savedId = randomUUID();
		await db.rssFeed.createMany({
			data: feedIds.map((id, i) => ({
				id,
				userId: owner.id,
				url: `https://example.com/perf-${id}`,
				title: `Performance feed ${i}`,
				folder: "",
				lastFetchedAt: now,
			})),
		});
		await db.rssUnread.createMany({
			data: Array.from({ length: 61 }, (_, i) => ({
				id: randomUUID(),
				userId: owner.id,
				feedId: feedIds[i === 60 ? 1 : 0],
				url: `https://example.com/perf-${feedIds[0]}/${i}`,
				title: `Performance article ${i}`,
				receivedAt: new Date(now.getTime() - i * 1000),
			})),
		});
		await db.rssSaved.create({
			data: {
				id: savedId,
				userId: owner.id,
				url: `https://example.com/perf-saved-${savedId}`,
				title: "Performance saved article",
				savedAt: now,
			},
		});
		const reads: string[] = [];
		const refreshes: string[] = [];
		page.on("request", (request) => {
			const url = new URL(request.url());
			if (url.pathname === "/api/v1/rss" && request.method() === "GET")
				reads.push(request.url());
			if (url.pathname === "/api/v1/rss/refresh") refreshes.push(request.url());
		});
		try {
			const started = performance.now();
			await page.goto("/ja/rss");
			await expect(
				page.getByRole("link", { name: "Performance article 0", exact: true }),
			).toBeVisible();
			const firstVisibleMs = performance.now() - started;
			// Scrolling to the loaded tail requests the next batch without a button click.
			await page
				.getByRole("link", { name: "Performance article 49", exact: true })
				.scrollIntoViewIfNeeded();
			await expect(
				page.getByRole("link", { name: "Performance article 50", exact: true }),
			).toBeVisible();
			await expect(
				page.getByRole("link", { name: "Performance article 0", exact: true }),
			).toHaveCount(1);
			await expect(page.getByRole("button", { name: "次へ" })).toHaveCount(0);
			expect(reads).toHaveLength(1);
			expect(new URL(reads[0]).searchParams.get("view")).toBe("unread");
			expect(new URL(reads[0]).searchParams.get("offset")).toBe("50");
			await page
				.getByRole("combobox", { name: "購読で絞り込み" })
				.selectOption(feedIds[1]);
			await expect(
				page.getByRole("link", { name: "Performance article 60", exact: true }),
			).toBeVisible();
			expect(reads).toHaveLength(2);
			expect(new URL(reads[1]).searchParams.get("feedId")).toBe(feedIds[1]);
			expect(new URL(reads[1]).searchParams.get("offset")).toBe("0");
			expect(refreshes).toHaveLength(0);
			await page.locator('header a[href="/ja/rss/saved"]').click();
			await expect(
				page.getByRole("link", { name: "Performance saved article" }),
			).toBeVisible();
			await test.info().attach("rss-navigation", {
				body: JSON.stringify({ firstVisibleMs, reads, refreshes }),
				contentType: "application/json",
			});
			await page.screenshot({
				path: "/tmp/rss-performance-e2e.png",
				fullPage: true,
			});
		} finally {
			await db.rssFeed.deleteMany({ where: { id: { in: feedIds } } });
			await db.rssSaved.deleteMany({ where: { id: savedId } });
			await db.$disconnect();
		}
	});

	test("saved entries append across three batches and stop at the end", async ({
		page,
	}) => {
		const db = localDatabase();
		await page.request.get("/api/sign-in", { maxRedirects: 0 });
		const owner = await db.user.findUniqueOrThrow({
			where: { email: process.env.LOCAL_AUTH_EMAIL },
		});
		const prefix = `https://example.com/infinite-saved-${randomUUID()}/`;
		const now = Date.now();
		await db.rssSaved.createMany({
			data: Array.from({ length: 120 }, (_, index) => ({
				id: randomUUID(),
				userId: owner.id,
				url: `${prefix}${index}`,
				title: `Infinite saved ${index}`,
				savedAt: new Date(now - index * 1000),
			})),
		});
		const reads: string[] = [];
		page.on("request", (request) => {
			const url = new URL(request.url());
			if (url.pathname === "/api/v1/rss" && request.method() === "GET")
				reads.push(request.url());
		});
		try {
			await page.goto("/ja/rss/saved");
			await expect(
				page.getByRole("link", { name: "Infinite saved 0", exact: true }),
			).toBeVisible();
			await page
				.getByRole("link", { name: "Infinite saved 49", exact: true })
				.scrollIntoViewIfNeeded();
			await expect(
				page.getByRole("link", { name: "Infinite saved 50", exact: true }),
			).toHaveCount(1);
			await page
				.getByRole("link", { name: "Infinite saved 99", exact: true })
				.scrollIntoViewIfNeeded();
			await expect(
				page.getByRole("link", { name: "Infinite saved 119", exact: true }),
			).toHaveCount(1);
			await expect(page.getByText("120 / 120件を表示")).toBeVisible();
			await expect(
				page.getByRole("button", { name: "さらに読み込む" }),
			).toHaveCount(0);
			expect(
				reads.map((url) => new URL(url).searchParams.get("offset")),
			).toEqual(["50", "100"]);
			await page
				.getByRole("link", { name: "Infinite saved 0", exact: true })
				.scrollIntoViewIfNeeded();
			await expect(
				page.getByRole("region", { name: "保存済み" }).getByRole("link"),
			).toHaveCount(120);
		} finally {
			await db.rssSaved.deleteMany({
				where: { userId: owner.id, url: { startsWith: prefix } },
			});
			await db.$disconnect();
		}
	});

	test("opens an article without marking it read, toggles stars, marks all read, and imports saved links", async ({
		page,
		context,
	}) => {
		const db = localDatabase();
		const feedId = randomUUID();
		const entryId = randomUUID();
		const articleUrl = `https://example.com/e2e-article-${entryId}`;
		const imageUrl =
			"https://www.inoreader.com/blog/wp-content/uploads/2021/02/fresh-new-look-1024x512.png";
		await page.request.get("/api/sign-in", { maxRedirects: 0 });
		const owner = await db.user.findUniqueOrThrow({
			where: { email: process.env.LOCAL_AUTH_EMAIL },
		});
		await db.rssFeed.create({
			data: {
				id: feedId,
				userId: owner.id,
				url: `https://example.com/e2e-feed-${feedId}`,
				title: "E2E RSS feed",
				folder: "",
				lastFetchedAt: new Date(),
			},
		});
		await db.rssUnread.create({
			data: {
				id: entryId,
				userId: owner.id,
				feedId,
				title: "E2E unread article",
				url: articleUrl,
				imageUrl,
				publishedAt: null,
				receivedAt: new Date(),
			},
		});
		await db.rssSeen.create({
			data: {
				feedId,
				hash: createHash("sha256").update("fixture-id").digest(),
			},
		});
		try {
			await page.goto("/ja/rss");
			const reader = page.getByRole("main", { name: "RSSリーダー" });
			const article = reader.getByRole("link", { name: "E2E unread article" });
			await expect(article).toBeVisible();
			await expect(
				reader.getByRole("button", { name: "既読にする", exact: true }),
			).toHaveCount(0);
			const thumbnail = reader.locator("img");
			await expect(thumbnail).toBeVisible();
			await expect
				.poll(
					() =>
						thumbnail.evaluate(
							(image: HTMLImageElement) =>
								image.complete && image.naturalWidth > 0,
						),
					{ timeout: 30_000 },
				)
				.toBe(true);
			await context.route(articleUrl, (route) =>
				route.fulfill({ contentType: "text/plain", body: "RSS article" }),
			);
			const [popup] = await Promise.all([
				page.waitForEvent("popup"),
				article.click(),
			]);
			await expect(popup).toHaveURL(articleUrl);
			await popup.close();
			await expect(article).toBeVisible();
			await expect(reader.getByText("1 / 1件を表示")).toBeVisible();
			await reader
				.getByRole("button", { name: "あとで読むに保存", exact: true })
				.click();
			await expect(
				reader.getByRole("button", { name: "保存を解除" }),
			).toHaveAttribute("aria-pressed", "true");
			expect(
				(
					await db.rssSaved.findFirstOrThrow({
						where: { userId: owner.id, url: articleUrl },
					})
				).imageUrl,
			).toBe(imageUrl);
			await reader.getByRole("button", { name: "保存を解除" }).click();
			await expect(
				reader.getByRole("button", { name: "あとで読むに保存", exact: true }),
			).toHaveAttribute("aria-pressed", "false");
			await reader
				.getByRole("button", { name: "あとで読むに保存", exact: true })
				.click();
			await expect(
				reader.getByRole("button", { name: "保存を解除" }),
			).toBeVisible();
			await reader.getByRole("button", { name: "すべて既読にする" }).click();
			await expect(reader.getByText("未読記事はありません。")).toBeVisible();
			await page.locator('header a[href="/ja/rss/saved"]').click();
			await expect(
				page.getByRole("link", { name: "E2E unread article" }),
			).toBeVisible();
			await expect(
				page.getByRole("button", { name: "保存を解除" }),
			).toHaveAttribute("aria-pressed", "true");
			await page.goto("/ja/settings/rss");
			const exportFile = {
				name: "starred.json",
				mimeType: "application/json",
				buffer: Buffer.from(
					JSON.stringify({
						items: [
							{
								title: "Imported Inoreader link",
								canonical: [{ href: `${articleUrl}/saved` }],
								summary: { content: "BODY_MUST_NOT_BE_STORED" },
							},
						],
					}),
				),
			};
			await expect(page.getByLabel("取り込みファイル")).toBeEnabled();
			await page.getByLabel("取り込みファイル").setInputFiles(exportFile);
			await expect(
				page.getByText("追加 1件・重複 0件・不正 0件"),
			).toBeVisible();
			await page.getByLabel("取り込みファイル").setInputFiles([]);
			await expect(page.getByLabel("取り込みファイル")).toBeEnabled();
			await page.getByLabel("取り込みファイル").setInputFiles(exportFile);
			await expect(
				page.getByText("追加 0件・重複 1件・不正 0件"),
			).toBeVisible();
			await page.goto("/ja/rss/saved");
			await expect(
				page.getByRole("link", { name: "Imported Inoreader link" }),
			).toBeVisible();
			expect(await db.rssUnread.count({ where: { userId: owner.id } })).toBe(0);
			expect(await db.rssSaved.count({ where: { userId: owner.id } })).toBe(2);
			await page.screenshot({
				path: "/private/tmp/rss-compact-e2e.png",
				fullPage: true,
			});
		} finally {
			await db.rssFeed.deleteMany({ where: { id: feedId, userId: owner.id } });
			await db.rssSaved.deleteMany({
				where: {
					userId: owner.id,
					url: { in: [articleUrl, `${articleUrl}/saved`] },
				},
			});
			await db.$disconnect();
		}
	});
});

test.describe("RSS concurrent interactions", () => {
	test.skip(
		!enabled,
		"Requires the local RSS backend and dedicated migrated DB",
	);
	test("page two stays stable and mark-all during refresh leaves new arrivals unread", async ({
		page,
	}) => {
		const db = localDatabase();
		await page.request.get("/api/sign-in", { maxRedirects: 0 });
		const owner = await db.user.findUniqueOrThrow({
			where: { email: process.env.LOCAL_AUTH_EMAIL },
		});
		const feedId = randomUUID();
		const now = new Date();
		const arrived = Promise.withResolvers<void>();
		const finishRead = Promise.withResolvers<void>();
		let holdNextRead = false;
		let savedUrl: string | undefined;
		await db.rssFeed.create({
			data: {
				id: feedId,
				userId: owner.id,
				url: `https://example.com/concurrent-${feedId}`,
				title: "Concurrent feed",
				folder: "",
				lastFetchedAt: now,
			},
		});
		const seed = async (prefix: string, count: number) =>
			db.$transaction(async (tx) => {
				const state = await tx.rssState.upsert({
					where: { userId: owner.id },
					create: { userId: owner.id, revision: 1 },
					update: { revision: { increment: 1 } },
				});
				await tx.rssUnread.createMany({
					data: Array.from({ length: count }, (_, i) => ({
						id: randomUUID(),
						userId: owner.id,
						feedId,
						url: `https://example.com/${feedId}/${prefix}/${i}`,
						title: `Concurrent ${prefix} ${i}`,
						receivedAt: new Date(Date.now() - i * 1000),
						revision: state.revision,
					})),
				});
			});
		await seed("original", 61);
		await page.route("**/api/v1/rss?*", async (route) => {
			if (holdNextRead) {
				holdNextRead = false;
				arrived.resolve();
				await finishRead.promise;
			}
			await route.continue();
		});
		try {
			await page.goto("/ja/rss");
			await page
				.getByRole("combobox", { name: "購読で絞り込み" })
				.selectOption(feedId);
			await page
				.getByRole("button", { name: "さらに読み込む" })
				.scrollIntoViewIfNeeded();
			await expect(
				page.getByRole("link", { name: "Concurrent original 50", exact: true }),
			).toBeVisible();
			const before = await page
				.getByRole("region", { name: "未読" })
				.getByRole("link")
				.allTextContents();
			// A server job has already committed new articles. The reader only reads the DB.
			await seed("new", 2);
			holdNextRead = true;
			await page.getByRole("button", { name: "更新", exact: true }).click();
			await arrived.promise;
			await expect(
				page.getByRole("button", { name: "更新", exact: true }),
			).toBeDisabled();
			expect(
				await page
					.getByRole("region", { name: "未読" })
					.getByRole("link")
					.allTextContents(),
			).toEqual(before);
			const card = page.getByRole("listitem").filter({
				has: page.getByRole("link", {
					name: "Concurrent original 50",
					exact: true,
				}),
			});
			await card.getByRole("button", { name: "あとで読むに保存" }).click();
			await expect(
				card.getByRole("button", { name: "保存を解除" }),
			).toBeEnabled();
			savedUrl = `https://example.com/${feedId}/original/50`;
			await page.getByRole("button", { name: "すべて既読にする" }).click();
			await expect(page.getByText("未読記事はありません。")).toBeVisible();
			finishRead.resolve();
			await expect(
				page.getByRole("button", { name: "新着2件を表示" }),
			).toBeEnabled();
			expect(
				await db.rssUnread.count({ where: { userId: owner.id, feedId } }),
			).toBe(2);
			expect(
				await db.rssSaved.count({ where: { userId: owner.id, url: savedUrl } }),
			).toBe(1);
			await expect(page.getByText("0 / 0件を表示")).toBeVisible();
			await page.screenshot({
				path: test.info().outputPath("rss-read-with-new-arrivals.png"),
				fullPage: true,
			});
			await page.getByRole("button", { name: "新着2件を表示" }).click();
			await expect(
				page.getByRole("link", { name: "Concurrent new 0", exact: true }),
			).toBeVisible();
			await expect(page.getByText("2 / 2件を表示")).toBeVisible();
			await expect(page.getByRole("button", { name: "前へ" })).toHaveCount(0);
		} finally {
			finishRead.resolve();
			await page.unroute("**/api/v1/rss?*");
			await db.rssFeed.deleteMany({ where: { id: feedId } });
			await db.rssSaved.deleteMany({
				where: {
					userId: owner.id,
					url: { startsWith: `https://example.com/${feedId}/` },
				},
			});
			await db.$disconnect();
		}
	});
});

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
	test("opens an unread article, retains saved links, and imports Inoreader exports idempotently", async ({
		page,
	}) => {
		const db = localDatabase();
		const feedId = randomUUID();
		const entryId = randomUUID();
		const feedUrl = `https://example.com/e2e-feed-${feedId}`;
		const articleUrl = `https://example.com/e2e-article-${entryId}`;
		await page.request.get("/api/sign-in", { maxRedirects: 0 });
		const owner = await db.user.findUniqueOrThrow({
			where: { email: process.env.LOCAL_AUTH_EMAIL },
		});
		const publishedAt = null;
		await db.rssFeed.create({
			data: {
				id: feedId,
				userId: owner.id,
				url: feedUrl,
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
				publishedAt,
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
			await expect(
				page.getByRole("heading", { name: "RSSリーダー" }),
			).toBeVisible();
			await expect(
				page.getByRole("link", { name: "E2E unread article" }),
			).toBeVisible();
			await page
				.getByRole("button", { name: "あとで読むに保存", exact: true })
				.click();
			await expect(
				page.getByRole("button", { name: "あとで読む 1", exact: true }),
			).toBeVisible();
			await page
				.getByRole("link", { name: "E2E unread article" })
				.dispatchEvent("click", { button: 0 });
			await expect(page.getByText("未読記事はありません。")).toBeVisible();
			await page
				.getByRole("button", { name: "あとで読む 1", exact: true })
				.click();
			await expect(
				page.getByRole("link", { name: "E2E unread article" }),
			).toBeVisible();
			await page.getByRole("button", { name: /購読管理/u }).click();
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
			await page.getByLabel("取り込みファイル").setInputFiles(exportFile);
			await expect(
				page.getByText("追加 1件・重複 0件・不正 0件"),
			).toBeVisible();
			await page.getByLabel("取り込みファイル").setInputFiles([]);
			await page.getByLabel("取り込みファイル").setInputFiles(exportFile);
			await expect(
				page.getByText("追加 0件・重複 1件・不正 0件"),
			).toBeVisible();
			await page
				.getByRole("button", { name: "あとで読む 2", exact: true })
				.click();
			await expect(
				page.getByRole("link", { name: "Imported Inoreader link" }),
			).toBeVisible();
			expect(await db.rssUnread.count({ where: { userId: owner.id } })).toBe(0);
			expect(await db.rssSaved.count({ where: { userId: owner.id } })).toBe(2);
			await page.screenshot({
				path: "/tmp/rss-reader-e2e.png",
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

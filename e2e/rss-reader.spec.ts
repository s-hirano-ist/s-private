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
	test("renders article thumbnails, toggles stars, marks all read, and imports saved links", async ({
		page,
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
			await expect(
				reader.getByRole("link", { name: "E2E unread article" }),
			).toBeVisible();
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
			await page.getByLabel("取り込みファイル").setInputFiles(exportFile);
			await expect(
				page.getByText("追加 1件・重複 0件・不正 0件"),
			).toBeVisible();
			await page.getByLabel("取り込みファイル").setInputFiles([]);
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

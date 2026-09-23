import type { Page } from "@playwright/test";
import { instant } from "@next/playwright";
import { expect, test } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const ROUTES = {
	articles: "/ja/articles",
	notes: "/ja/notes",
	books: "/ja/books",
	images: "/ja/images",
	imagesPageTwo: "/ja/images?page=2",
	bookDetail: "/ja/book/9780000000000",
	noteDetail: "/ja/note/instant-navigation-test",
} as const;

const DUMPER_FORM_FIELDS = [
	{ route: ROUTES.articles, fieldName: "カテゴリー" },
	{ route: ROUTES.notes, fieldName: "タイトル" },
	{ route: ROUTES.books, fieldName: "ISBN" },
	{ route: ROUTES.images, fieldName: "画像" },
] as const;

async function expectShell(page: Page) {
	await expect(page.locator("main")).toBeVisible();
	await expect(page.locator("footer")).toBeVisible();
	await expect(page.getByLabel("Loading").first()).toBeVisible();
}

test.describe("Instant Navigation", () => {
	test("commits the articles shell before dynamic data resolves", async ({
		page,
	}) => {
		await instant(
			page,
			async () => {
				await page.goto(ROUTES.articles, { waitUntil: "commit" });
				await expectShell(page);
			},
			{ baseURL: BASE_URL },
		);
	});

	for (const { route, fieldName } of DUMPER_FORM_FIELDS) {
		test(`renders the ${fieldName} dumper input outside the dynamic stream`, async ({
			page,
		}) => {
			await instant(
				page,
				async () => {
					await page.goto(route, { waitUntil: "commit" });
					await page.getByRole("button", { name: "新規作成" }).click();
					await expect(page.getByLabel(fieldName)).toBeVisible();
					await expect(page.getByLabel("Loading").first()).toBeVisible();
				},
				{ baseURL: BASE_URL },
			);
		});
	}

	test("commits tab and programmatic layout navigations immediately", async ({
		page,
	}) => {
		await page.goto(ROUTES.articles);
		await expect(page.getByLabel("Loading")).toHaveCount(0);

		await instant(page, async () => {
			await page
				.getByRole("navigation", { name: "コンテンツの種類" })
				.getByRole("link", { name: "ノート" })
				.click();
			await expect(page).toHaveURL(new RegExp(`${ROUTES.notes}$`, "u"));
			await expectShell(page);
		});

		await expect(page.getByLabel("Loading")).toHaveCount(0);

		await instant(page, async () => {
			await page.getByRole("link", { name: "公開済み" }).click();
			await expect(page).toHaveURL(/\/ja\/notes\/viewer$/u);
			await expectShell(page);
		});
	});

	test("keeps URL-dependent detail and pagination data behind the shell", async ({
		page,
	}) => {
		await instant(
			page,
			async () => {
				await page.goto(ROUTES.noteDetail, { waitUntil: "commit" });
				await expect(page).toHaveURL(new RegExp(`${ROUTES.noteDetail}$`, "u"));
				await expectShell(page);
			},
			{ baseURL: BASE_URL },
		);

		await instant(page, async () => {
			await page.goto(ROUTES.bookDetail, { waitUntil: "commit" });
			await expect(page).toHaveURL(new RegExp(`${ROUTES.bookDetail}$`, "u"));
			await expectShell(page);
		});

		await instant(page, async () => {
			await page.goto(ROUTES.imagesPageTwo, { waitUntil: "commit" });
			await expect(page).toHaveURL(/\/ja\/images\?page=2$/u);
			await expectShell(page);
		});
	});

	test("continues to redirect unauthenticated requests to Auth0", async ({
		browser,
	}) => {
		const context = await browser.newContext({ storageState: undefined });
		const page = await context.newPage();

		await page.goto(ROUTES.articles);
		await expect(page).toHaveURL(/auth0/u, { timeout: 30_000 });

		await context.close();
	});
});

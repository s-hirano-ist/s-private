import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

async function openCreateDialog(page: Page) {
	await expect(async () => {
		await page.getByRole("button", { name: "新規作成" }).click();
		await expect(page.getByRole("dialog", { name: "新規作成" })).toBeVisible();
	}).toPass({ timeout: 15_000 });
}

const domains = [
	{ name: "articles", formLabel: "カテゴリー", fixture: "E2E seeded article" },
	{ name: "notes", formLabel: "タイトル", fixture: "E2E seeded note" },
	{ name: "books", formLabel: "ISBN", fixture: "E2E seeded book" },
] as const;

test.describe("content navigation", () => {
	for (const domain of domains) {
		test(`${domain.name} opens its create form`, async ({ page }) => {
			await page.goto(`/ja/${domain.name}`);
			await expect(
				page.getByRole("link", { name: /公開状態: 公開済み/u }),
			).toBeVisible();
			await openCreateDialog(page);
			await expect(page.getByLabel(domain.formLabel)).toBeVisible();
		});

		test(`${domain.name} default exported list renders seeded content`, async ({
			page,
		}) => {
			await page.goto(`/ja/${domain.name}`);
			await expect(page.getByText(domain.fixture).first()).toBeVisible();
			await expect(
				page.getByRole("link", { name: /公開状態: 公開済み/u }),
			).toBeVisible();
		});
	}

	test("images opens its create form", async ({ page }) => {
		await page.goto("/ja/images");
		await expect(
			page.getByRole("link", { name: /公開状態: 公開済み/u }),
		).toBeVisible();
		await openCreateDialog(page);
		await expect(page.getByLabel("画像")).toBeVisible();
	});

	test("images default exported list renders the seeded image", async ({
		page,
	}) => {
		await page.goto("/ja/images");
		await expect(
			page.getByRole("img", { name: /seeded-image\.png/u }),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: /公開状態: 公開済み/u }),
		).toBeVisible();
	});

	test("keeps export status while changing content type", async ({ page }) => {
		await page.goto("/ja/articles");
		await page
			.getByRole("navigation", { name: "コンテンツの種類" })
			.getByRole("link", { name: "書籍" })
			.click();
		await expect(page).toHaveURL(/\/ja\/books$/u);
		// Navigation can expose the server-rendered button before hydration finishes.
		// Opening is idempotent, so retry the interaction until its result is visible.
		await expect(async () => {
			await page.getByRole("button", { name: "検索" }).click();
			await expect(page.getByRole("textbox")).toBeVisible();
		}).toPass({ timeout: 15_000 });
	});

	test("opens settings from the top bar", async ({ page }) => {
		await page.goto("/ja/articles");
		await page.getByRole("link", { name: "設定" }).click();
		await expect(page).toHaveURL(/\/ja\/settings$/u);
		await expect(
			page.getByRole("button", { name: /再読み込み/u }),
		).toBeVisible();
	});
});

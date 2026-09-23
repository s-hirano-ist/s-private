import { expect, test } from "@playwright/test";

const domains = [
	{ name: "articles", formLabel: "カテゴリー", fixture: "E2E seeded article" },
	{ name: "notes", formLabel: "タイトル", fixture: "E2E seeded note" },
	{ name: "books", formLabel: "ISBN", fixture: "E2E seeded book" },
] as const;

test.describe("content navigation", () => {
	for (const domain of domains) {
		test(`${domain.name} opens its create form`, async ({ page }) => {
			await page.goto(`/ja/${domain.name}`);
			await page.getByRole("button", { name: "新規作成" }).click();
			await expect(page.getByLabel(domain.formLabel)).toBeVisible();
			await expect(page.getByRole("link", { name: "公開済み" })).toBeVisible();
		});

		test(`${domain.name} viewer renders seeded content`, async ({ page }) => {
			await page.goto(`/ja/${domain.name}/viewer`);
			await expect(page.getByText(domain.fixture).first()).toBeVisible();
			await expect(page.getByRole("link", { name: "未公開" })).toBeVisible();
		});
	}

	test("images opens its create form", async ({ page }) => {
		await page.goto("/ja/images");
		await page.getByRole("button", { name: "新規作成" }).click();
		await expect(page.getByLabel("画像")).toBeVisible();
		await expect(page.getByRole("link", { name: "公開済み" })).toBeVisible();
	});

	test("images viewer renders the seeded image", async ({ page }) => {
		await page.goto("/ja/images/viewer");
		await expect(
			page.getByRole("img", { name: /seeded-image\.png/u }),
		).toBeVisible();
		await expect(page.getByRole("link", { name: "未公開" })).toBeVisible();
	});

	test("keeps export status while changing content type", async ({ page }) => {
		await page.goto("/ja/articles/viewer");
		await page
			.getByRole("navigation", { name: "コンテンツの種類" })
			.getByRole("link", { name: "書籍" })
			.click();
		await expect(page).toHaveURL(/\/ja\/books\/viewer$/u);
		await page.getByRole("button", { name: "検索" }).click();
		await expect(page.getByRole("textbox")).toBeVisible();
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

import { expect, test } from "@playwright/test";

const domains = [
	{ name: "articles", formLabel: "カテゴリー", fixture: "E2E seeded article" },
	{ name: "notes", formLabel: "タイトル", fixture: "E2E seeded note" },
	{ name: "books", formLabel: "ISBN", fixture: "E2E seeded book" },
] as const;

test.describe("main dumper and viewer flows", () => {
	for (const domain of domains) {
		test(`${domain.name} dumper renders its primary input`, async ({
			page,
		}) => {
			await page.goto(`/ja/${domain.name}`);
			await expect(page.getByLabel(domain.formLabel)).toBeVisible();
			await expect(page.getByRole("button", { name: "VIEWER" })).toBeVisible();
		});

		test(`${domain.name} viewer renders seeded content`, async ({ page }) => {
			await page.goto(`/ja/${domain.name}/viewer`);
			await expect(page.getByText(domain.fixture).first()).toBeVisible();
			await expect(page.getByRole("button", { name: "DUMPER" })).toBeVisible();
		});
	}

	test("images dumper renders its primary input", async ({ page }) => {
		await page.goto("/ja/images");
		await expect(page.getByLabel("画像")).toBeVisible();
		await expect(page.getByRole("button", { name: "VIEWER" })).toBeVisible();
	});

	test("images viewer renders the seeded image", async ({ page }) => {
		await page.goto("/ja/images/viewer");
		await expect(
			page.getByRole("img", { name: /seeded-image\.png/u }),
		).toBeVisible();
		await expect(page.getByRole("button", { name: "DUMPER" })).toBeVisible();
	});
});

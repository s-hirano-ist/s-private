import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const draftKey = "s-private:form-draft:v1:alice:notes:create";
async function open(page: Page) {
	await page.getByRole("button", { name: "新規作成" }).click();
	return page.getByRole("dialog");
}
async function fill(
	page: Page,
	title = "日本語の下書き",
	markdown = "# 作成途中の本文",
) {
	const dialog = await open(page);
	await dialog
		.getByRole("textbox", { name: "タイトル" })
		.dispatchEvent("compositionstart");
	await dialog.getByRole("textbox", { name: "タイトル" }).fill(title);
	await dialog
		.getByRole("textbox", { name: "タイトル" })
		.dispatchEvent("compositionend");
	await dialog.getByRole("textbox", { name: "詳細" }).fill(markdown);
	return dialog;
}
async function expectDraft(
	page: Page,
	title = "日本語の下書き",
	markdown = "# 作成途中の本文",
) {
	const dialog = await open(page);
	await expect(dialog.getByRole("textbox", { name: "タイトル" })).toHaveValue(
		title,
	);
	await expect(dialog.getByRole("textbox", { name: "詳細" })).toHaveValue(
		markdown,
	);
	return dialog;
}
test.beforeEach(async ({ context, request, page }) => {
	await request.post("http://127.0.0.1:4328/__reset");
	await context.addCookies([
		{
			name: "better-auth.session_token",
			value: "alice",
			url: "http://localhost:4327",
		},
	]);
	await page.goto("/ja/notes");
});

test("close, navigation, reload, empty edits and discard preserve the latest text", async ({
	page,
}) => {
	await fill(page);
	await page.keyboard.press("Escape");
	await expectDraft(page);
	await page.keyboard.press("Escape");
	await page.getByRole("link", { name: "記事", exact: true }).click();
	await expect(page).toHaveURL(/\/ja\/articles$/u);
	await page.getByRole("button", { name: "新規作成" }).click();
	await expect(page.getByRole("dialog").getByLabel("タイトル")).toHaveValue("");
	await page.keyboard.press("Escape");
	await page.getByRole("link", { name: "ノート", exact: true }).click();
	await expect(page).toHaveURL(/\/ja\/notes$/u);
	await page.reload();
	const dialog = await expectDraft(page);
	await dialog.getByLabel("タイトル").fill("");
	await page.reload();
	await expectDraft(page, "");
	await page.getByRole("button", { name: "下書きを破棄" }).click();
	await page.reload();
	await expectDraft(page, "", "");
	expect(
		await page.evaluate((key) => sessionStorage.getItem(key), draftKey),
	).toBeNull();
});

test("failed submission survives reload; successful retry clears storage and pending timers", async ({
	page,
}) => {
	await fill(page, "notes alice 0");
	await page.getByRole("button", { name: "保存", exact: true }).click();
	await expect(
		page.getByText("すでに登録されているため登録できません。"),
	).toBeVisible();
	await page.reload();
	const dialog = await expectDraft(page, "notes alice 0");
	await dialog.getByLabel("タイトル").fill("成功するメモ");
	await dialog.getByRole("button", { name: "保存", exact: true }).click();
	await expect(page.getByText("正常に登録されました。")).toBeVisible();
	await page.reload();
	await expectDraft(page, "", "");
	expect(
		await page.evaluate((key) => sessionStorage.getItem(key), draftKey),
	).toBeNull();
});

test("switching users clears the former tenant draft and never restores it", async ({
	page,
	context,
}) => {
	await fill(page);
	await page.keyboard.press("Escape");
	await context.addCookies([
		{
			name: "better-auth.session_token",
			value: "bob",
			url: "http://localhost:4327",
		},
	]);
	await page.reload();
	await expectDraft(page, "", "");
	expect(
		await page.evaluate((key) => sessionStorage.getItem(key), draftKey),
	).toBeNull();
	await context.addCookies([
		{
			name: "better-auth.session_token",
			value: "alice",
			url: "http://localhost:4327",
		},
	]);
	await page.reload();
	await expectDraft(page, "", "");
});

test("invalid storage and unavailable storage keep the form usable", async ({
	page,
}) => {
	await page.evaluate(
		(key) => sessionStorage.setItem(key, "{broken"),
		draftKey,
	);
	await expectDraft(page, "", "");
	await page.keyboard.press("Escape");
	await page.evaluate(() => {
		Object.defineProperty(window, "sessionStorage", {
			configurable: true,
			get() {
				throw new Error("SecurityError");
			},
		});
	});
	await fill(page);
	await page.keyboard.press("Escape");
	await expectDraft(page);
});

test("logout removes drafts", async ({ page }) => {
	await fill(page);
	await page.keyboard.press("Escape");
	await page.getByRole("link", { name: "設定", exact: true }).click();
	await page.route("**/api/auth/sign-out", (route) =>
		route.fulfill({ json: { success: true } }),
	);
	await page.getByTestId("log-out-button").click();
	await expect(page).toHaveURL(/\/ja\/?$/u);
	expect(
		await page.evaluate((key) => sessionStorage.getItem(key), draftKey),
	).toBeNull();
});

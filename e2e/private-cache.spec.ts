import type { APIRequestContext, BrowserContext, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const backend = "http://127.0.0.1:4328";
const domains = ["articles", "notes", "books", "images"] as const;
async function login(context: BrowserContext, user = "alice") {
	await context.addCookies([
		{
			name: "better-auth.session_token",
			value: user,
			url: "http://localhost:4327",
		},
	]);
}
async function navigate(page: Page, path: string) {
	await page.locator(`a[href="/ja/${path}"]`).first().click();
	await expect(page).toHaveURL(`http://localhost:4327/ja/${path}`);
	await expect(page.getByLabel("Loading")).toHaveCount(0);
}
async function count(
	request: APIRequestContext,
	domain: string,
	user = "alice",
) {
	const calls: Record<string, number> = await (
		await request.get(`${backend}/__calls`)
	).json();
	return Object.entries(calls)
		.filter(([key]) => key.startsWith(`${user}:GET:/api/v1/${domain}?`))
		.reduce((total, [, value]) => total + value, 0);
}
async function seed(
	request: APIRequestContext,
	domain: string,
	status = "UNEXPORTED",
	size = 1,
) {
	await request.post(`${backend}/__seed`, {
		data: { domain, status, count: size },
	});
}
async function ready(page: Page) {
	await expect(page.getByLabel("Loading")).toHaveCount(0);
	await expect(
		page.getByRole("navigation", { name: "コンテンツの種類" }),
	).toBeVisible();
}

test.beforeEach(async ({ context, request, page }) => {
	await request.post(`${backend}/__reset`);
	await login(context);
	await page.route(/sentry\.io|\/monitoring/u, (route) =>
		route.fulfill({ status: 200, body: "{}" }),
	);
});

for (const domain of domains) {
	test(`${domain}: a second visit reuses the private result and reload fetches again`, async ({
		page,
		request,
	}) => {
		await page.goto(`/ja/${domain}`);
		await ready(page);
		if (domain === "images") {
			await expect(
				page.getByRole("button", { name: "削除", exact: true }),
			).toHaveCount(1);
		} else {
			await expect(
				page.getByText(`${domain} alice 0`, { exact: true }),
			).toBeVisible();
		}
		expect(await count(request, domain)).toBeGreaterThan(0);
		await navigate(page, domain === "notes" ? "articles" : "notes");
		const before = await count(request, domain);
		await navigate(page, domain);
		expect(await count(request, domain)).toBe(before);
		await page.reload();
		await ready(page);
		expect(await count(request, domain)).toBeGreaterThan(before);
	});
}

test("private results expire after sixty seconds", async ({
	page,
	request,
}) => {
	await page.goto("/ja/articles");
	await ready(page);
	await navigate(page, "notes");
	const before = await count(request, "articles");
	await page.clock.install();
	await page.clock.fastForward(61_000);
	await navigate(page, "articles");
	await expect.poll(() => count(request, "articles")).toBeGreaterThan(before);
});

test("successful note creation and deletion purge previously visited lists and details", async ({
	page,
	request,
}) => {
	await page.goto("/ja/notes");
	await ready(page);
	await page.getByRole("link", { name: /notes alice 0/u }).click();
	await expect(page).toHaveURL(/\/note\/notes%20alice%200$/u);
	await expect(
		page
			.getByText("Markdown alice 0", { exact: true })
			.filter({ visible: true }),
	).toBeVisible();
	await navigate(page, "notes/viewer");
	await navigate(page, "notes");
	await page.getByRole("button", { name: "新規作成", exact: true }).click();
	await page.getByLabel("タイトル", { exact: true }).fill("Created cache note");
	await page.locator('textarea[name="markdown"]').fill("Created markdown");
	await page.getByRole("button", { name: "保存", exact: true }).click();
	await expect(
		page.getByRole("link", { name: /Created cache note/u }),
	).toBeVisible();

	await navigate(page, "articles");
	await navigate(page, "notes");
	await expect(
		page.getByRole("link", { name: /Created cache note/u }),
	).toBeVisible();

	// The previously cached detail must also be invalidated by this domain's write.
	await page.getByRole("link", { name: /notes alice 0/u }).click();
	await expect(page).toHaveURL(/\/note\/notes%20alice%200$/u);
	await expect(
		page
			.getByText("Markdown alice 0", { exact: true })
			.filter({ visible: true }),
	).toBeVisible();
	await expect
		.poll(async () => {
			const calls = await (await request.get(`${backend}/__calls`)).json();
			return calls["alice:GET:/api/v1/notes/title/notes%20alice%200"] ?? 0;
		})
		.toBeGreaterThan(1);
	await navigate(page, "notes/viewer");
	await navigate(page, "notes");
	await page.getByRole("button", { name: "削除", exact: true }).first().click();
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "削除", exact: true })
		.click();
	await expect(
		page.getByRole("link", { name: /Created cache note/u }),
	).toHaveCount(0);
	await navigate(page, "articles");
	await navigate(page, "notes");
	await expect(
		page.getByRole("link", { name: /Created cache note/u }),
	).toHaveCount(0);
	// Delete the original note as well and verify that it leaves the list.
	await page.getByRole("button", { name: "削除", exact: true }).first().click();
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "削除", exact: true })
		.click();
	await expect(page.getByRole("link", { name: /notes alice 0/u })).toHaveCount(
		0,
	);
});

for (const domain of ["images", "books"] as const) {
	test(`${domain}: completing a chunked upload purges the previously visited list`, async ({
		page,
	}) => {
		await page.goto(`/ja/${domain}`);
		await ready(page);
		await navigate(page, "notes");
		await navigate(page, domain);
		await page.getByRole("button", { name: "新規作成", exact: true }).click();
		if (domain === "books") {
			await page.getByLabel("ISBN", { exact: true }).fill("9780306406158");
			await page
				.getByLabel("タイトル", { exact: true })
				.fill("Uploaded cache book");
			await page.locator('input[name="rating"]').fill("4");
		}
		const png = Buffer.from(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
			"base64",
		);
		await page
			.locator('input[type="file"]')
			.setInputFiles({ name: "cache.png", mimeType: "image/png", buffer: png });
		await page
			.getByRole("button", {
				name: domain === "images" ? "アップロード" : "保存",
				exact: true,
			})
			.click();
		await expect
			.poll(async () =>
				domain === "books"
					? page.getByText("Uploaded cache book", { exact: true }).count()
					: page.getByRole("button", { name: "削除", exact: true }).count(),
			)
			.toBe(domain === "books" ? 1 : 2);
		await navigate(page, "notes");
		await navigate(page, domain);
		if (domain === "books")
			await expect(
				page.getByText("Uploaded cache book", { exact: true }),
			).toBeVisible();
		else
			await expect(
				page.getByRole("button", { name: "削除", exact: true }),
			).toHaveCount(2);
	});
}

test("exported pages and counts stay separate from unexported results", async ({
	page,
	request,
}) => {
	await seed(request, "notes", "EXPORTED", 2);
	await page.goto("/ja/notes/viewer");
	await ready(page);
	await expect(page.getByRole("link", { name: /notes alice/u })).toHaveCount(2);
	await navigate(page, "notes");
	await expect(page.getByRole("link", { name: /notes alice/u })).toHaveCount(0);
	await navigate(page, "notes/viewer");
	await expect(page.getByRole("link", { name: /notes alice/u })).toHaveCount(2);
});

test("different browser sessions cannot reuse each other's private output", async ({
	browser,
	page,
}) => {
	await page.goto("/ja/notes");
	await ready(page);
	await expect(
		page.getByRole("link", { name: /notes alice 0/u }),
	).toBeVisible();
	const context = await browser.newContext();
	await login(context, "bob");
	const other = await context.newPage();
	await other.goto("http://localhost:4327/ja/notes");
	await ready(other);
	await expect(other.getByRole("link", { name: /notes bob 0/u })).toBeVisible();
	await expect(other.getByText("notes alice 0", { exact: true })).toHaveCount(
		0,
	);
	await context.close();
});

test("clearing the session and reloading rejects previously cached authenticated output", async ({
	page,
	context,
}) => {
	await page.goto("/ja/notes");
	await ready(page);
	await context.clearCookies();
	await page.reload();
	await expect(page).toHaveURL(/\/ja\/error$/u);
	await expect(page.getByText("notes alice 0", { exact: true })).toHaveCount(0);
});

test("pagination keeps each offset separate", async ({ page, request }) => {
	await seed(request, "notes", "UNEXPORTED", 30);
	await page.goto("/ja/notes");
	await ready(page);
	await expect(
		page.getByRole("link", { name: /notes alice 0\b/u }),
	).toBeVisible();
	await page
		.getByRole("link", { name: /notes alice 23\b/u })
		.scrollIntoViewIfNeeded();
	await expect(
		page.getByRole("link", { name: /notes alice 29\b/u }),
	).toBeAttached();
	const calls: Record<string, number> = await (
		await request.get(`${backend}/__calls`)
	).json();
	expect(
		Object.keys(calls).some(
			(key) => key.includes("/notes?") && key.includes("offset=24"),
		),
	).toBe(true);
	expect(
		Object.keys(calls).some(
			(key) => key.includes("/notes?") && key.includes("offset=0"),
		),
	).toBe(true);
});

test("the static shell and dumper form render while backend data is blocked", async ({
	page,
	request,
}) => {
	await request.post(`${backend}/__hold`);
	try {
		await page.goto("/ja/articles", { waitUntil: "commit" });
		await expect(page.locator("main")).toBeVisible();
		await expect(page.locator("footer")).toBeVisible();
		await expect(page.getByLabel("Loading").first()).toBeVisible();
		await page.getByRole("button", { name: "新規作成", exact: true }).click();
		await expect(page.getByLabel("カテゴリー", { exact: true })).toBeVisible();
		await expect(
			page.getByText("articles alice 0", { exact: true }),
		).toHaveCount(0);
	} finally {
		await request.post(`${backend}/__release`);
	}
	await expect(
		page.getByText("articles alice 0", { exact: true }),
	).toBeVisible();
});

import { expect, test } from "@playwright/test";
import { inflateSync } from "node:zlib";

test("a plain Chromium page does not inject inline styles into the CSP probe", async ({
	page,
}) => {
	await page.goto("http://127.0.0.1:4320");
	await expect(page.locator("#violations")).toHaveText("[]");
	expect(await page.locator("style").count()).toBe(0);
});

test("production CSP permits real next-themes transitions", async ({
	page,
}) => {
	const violations: string[] = [];
	const transitionStyles: string[] = [];
	await page.emulateMedia({ colorScheme: "light" });
	await page.addInitScript(() => {
		new MutationObserver((records) => {
			for (const record of records) {
				for (const node of record.addedNodes) {
					if (node instanceof HTMLStyleElement)
						console.info("THEME-STYLE", node.textContent);
				}
			}
		}).observe(document, { childList: true, subtree: true });
		document.addEventListener("securitypolicyviolation", (event) =>
			console.error("THEME-CSP", event.effectiveDirective),
		);
	});
	page.on("console", (message) => {
		if (message.text().includes("THEME-CSP")) violations.push(message.text());
		if (message.text().includes("THEME-STYLE"))
			transitionStyles.push(message.text());
	});
	await page.route(/sentry\.io|\/monitoring|csp\.invalid/u, (route) =>
		route.fulfill({ status: 200, body: "{}" }),
	);
	await page.goto("/ja/error");
	await expect(page.locator("html")).toHaveClass("light");
	await page.emulateMedia({ colorScheme: "dark" });
	await expect(page.locator("html")).toHaveClass("dark");
	await page.emulateMedia({ colorScheme: "light" });
	await expect(page.locator("html")).toHaveClass("light");
	await expect
		.poll(() =>
			transitionStyles.some((style) =>
				style.includes("transition:none!important"),
			),
		)
		.toBe(true);
	expect(violations).toEqual([]);
});

test("production CSP still blocks an unknown injected style", async ({
	page,
}) => {
	await page.route(/sentry\.io|\/monitoring|csp\.invalid/u, (route) =>
		route.fulfill({ status: 200, body: "{}" }),
	);
	await page.goto("/ja/error");
	const violation = await page.evaluate(
		() =>
			new Promise<{ directive: string; blocked: string }>((resolve) => {
				document.addEventListener(
					"securitypolicyviolation",
					(event) =>
						resolve({
							directive: event.effectiveDirective,
							blocked: event.blockedURI,
						}),
					{ once: true },
				);
				const style = document.createElement("style");
				style.textContent = ".csp-untrusted-probe { color: rgb(1, 2, 3); }";
				document.head.append(style);
				const probe = document.createElement("p");
				probe.className = "csp-untrusted-probe";
				probe.textContent = "CSP regression probe";
				document.body.append(probe);
			}),
	);
	expect(violation).toEqual({ directive: "style-src-elem", blocked: "inline" });
	await expect(page.locator(".csp-untrusted-probe")).not.toHaveCSS(
		"color",
		"rgb(1, 2, 3)",
	);
});

test("unsupported locales and scanner paths return 404 without importing messages", async ({
	request,
}) => {
	for (const path of ["/zz/error", "/sitemap.xml.zip", "/favicon.ico.zip"]) {
		const response = await request.get(path, {
			headers: { cookie: "better-auth.session_token=rum-fixture" },
		});
		expect(response.status()).toBe(404);
	}
});

test("OAuth retry uses a document navigation without RSC prefetch", async ({
	page,
}) => {
	const signInRequests: string[] = [];
	await page.route("**/api/sign-in**", async (route) => {
		signInRequests.push(route.request().resourceType());
		await route.fulfill({
			status: 200,
			contentType: "text/html",
			body: "<h1>OAuth entry</h1>",
		});
	});
	await page.route(/\/monitoring|sentry\.io/u, (route) =>
		route.fulfill({ status: 200, body: "{}" }),
	);
	await page.goto("/ja/error");
	const retry = page.getByRole("link", { name: "再サインイン" });
	await retry.hover();
	// Allow the browser to process idle prefetch work before the explicit navigation.
	await page.waitForTimeout(1000);
	expect(signInRequests).toEqual([]);
	await retry.click();
	await expect(
		page.getByRole("heading", { name: "OAuth entry" }),
	).toBeVisible();
	expect(signInRequests).toEqual(["document"]);
});

test("production prefetch and list navigation preserve Next.js control flow", async ({
	page,
	context,
}) => {
	await context.addCookies([
		{
			name: "better-auth.session_token",
			value: "rum-fixture",
			domain: "localhost",
			path: "/",
		},
	]);
	const failures: string[] = [];
	page.on("console", (message) => {
		if (message.text().includes("API_UNAVAILABLE"))
			failures.push(message.text());
	});
	await page.route(/\/monitoring|sentry\.io/u, (route) =>
		route.fulfill({ status: 200, body: "{}" }),
	);
	await page.goto("/ja/articles");
	await expect(page.getByLabel("Loading")).toHaveCount(0);
	for (const name of ["ノート", "画像", "書籍", "記事"]) {
		await page
			.getByRole("navigation", { name: "コンテンツの種類" })
			.getByRole("link", { name, exact: true })
			.click();
		await expect(page.getByLabel("Loading")).toHaveCount(0);
		await expect(page.locator("main")).not.toContainText("500");
		await page.getByRole("link", { name: /公開済みに切り替え/u }).click();
		await expect(page).toHaveURL(/\/viewer$/u);
		await expect(page.getByLabel("Loading")).toHaveCount(0);
		await expect(page.locator("main")).not.toContainText("500");
		await page.getByRole("link", { name: /未公開に切り替え/u }).click();
		await expect(page).not.toHaveURL(/\/viewer$/u);
	}
	expect(failures).toEqual([]);
});

// The dedicated config uses a production build and fake DSN, without auth/DB fixtures.
test("production RUM links vitals, error and masked Replay without sending to Sentry", async ({
	page,
}) => {
	const envelopes: Buffer[] = [];
	const violations: string[] = [];
	await page.addInitScript(() => {
		// Make the 10% error-Replay sample deterministic, without changing production configuration.
		Math.random = () => 0;
		document.addEventListener("securitypolicyviolation", (event) => {
			console.error("RUM-CSP", event.violatedDirective);
		});
	});
	page.on("console", (message) => {
		if (message.text().includes("RUM-CSP")) violations.push(message.text());
	});
	await page.route(/\/monitoring|sentry\.io/u, async (route) => {
		const body = route.request().postDataBuffer();
		if (body) envelopes.push(body);
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: "{}",
		});
	});
	await page.goto("/ja/error");
	await page.locator("main").first().waitFor();
	await page.evaluate(() => {
		const input = document.createElement("input");
		input.value = "RUM_PRIVATE_INPUT_2765";
		input.placeholder = "RUM_PRIVATE_ATTRIBUTE_2765";
		document.body.append(input);
		const text = document.createElement("p");
		text.textContent = "RUM_PRIVATE_TEXT_2765";
		document.body.append(text);
		const image = document.createElement("img");
		image.src = "/logo.png?private=RUM_PRIVATE_IMAGE_URL_2765";
		image.alt = "RUM_PRIVATE_IMAGE_2765";
		document.body.append(image);
	});
	await page.locator("body").click({ position: { x: 5, y: 5 } });
	await expect
		.poll(() =>
			envelopes.some((body) => body.includes("browser.web_vital.lcp.value")),
		)
		.toBe(true);
	await page.evaluate(() => {
		setTimeout(() => {
			throw new Error("RUM_SMOKE_ERROR_2765");
		}, 0);
	});
	await expect
		.poll(() =>
			envelopes.some((body) => body.includes('"type":"replay_recording"')),
		)
		.toBe(true);
	const spanBody = envelopes.find((body) => body.includes('"type":"span"'));
	const errorBody = envelopes.find((body) =>
		body.includes("RUM_SMOKE_ERROR_2765"),
	);
	const replayBody = envelopes.find((body) =>
		body.includes('"type":"replay_recording"'),
	);
	expect(spanBody).toBeDefined();
	expect(errorBody).toBeDefined();
	if (!spanBody || !errorBody || !replayBody)
		throw new Error("Missing RUM envelopes");
	const header: {
		dsn: string;
		trace: { trace_id: string; environment: string };
	} = JSON.parse(spanBody.toString().split("\n")[0] ?? "{}");
	expect(header.dsn).toBe("https://public@o0.ingest.sentry.io/1");
	expect(header.trace.environment).toBe("production");
	expect(spanBody.includes('"resource.img"')).toBe(true);
	expect(spanBody.includes("RUM_PRIVATE_")).toBe(false);
	expect(errorBody.includes(header.trace.trace_id)).toBe(true);
	expect(replayBody.includes(header.trace.trace_id)).toBe(true);
	const recordingHeader = replayBody.indexOf('"type":"replay_recording"');
	const segmentStart = replayBody.indexOf("\n", recordingHeader) + 1;
	const compressedStart = replayBody.indexOf("\n", segmentStart) + 1;
	const recording = inflateSync(
		replayBody.subarray(compressedStart),
	).toString();
	expect(recording).toContain("**");
	expect(recording).not.toContain("RUM_PRIVATE_");
	expect(violations).toEqual([]);
});

for (const locale of ["ja", "en"] as const) {
	test(`production Feedback ${locale} uses the SDK form and preserves CSP and privacy`, async ({
		page,
		context,
	}) => {
		await context.addCookies([
			{
				name: "better-auth.session_token",
				value: "rum-fixture",
				domain: "localhost",
				path: "/",
			},
		]);
		const violations: string[] = [];
		const envelopes: string[] = [];
		let feedbackFails = true;
		page.on("console", (message) => {
			if (message.text().includes("FEEDBACK-CSP"))
				violations.push(message.text());
		});
		await page.addInitScript(() =>
			document.addEventListener("securitypolicyviolation", (event) =>
				console.error(
					"FEEDBACK-CSP",
					event.effectiveDirective,
					event.blockedURI,
					event.sourceFile,
					event.lineNumber,
					event.columnNumber,
					event.sample,
				),
			),
		);
		await page.route(/sentry\.io|\/monitoring|csp\.invalid/u, async (route) => {
			const body = route.request().postData() ?? "";
			envelopes.push(body);
			await route.fulfill({
				status: body.includes('"feedback"') && feedbackFails ? 500 : 200,
				body: "{}",
			});
		});
		await page.goto(`/${locale}/settings`);
		const button = page.getByRole("button", {
			name: locale === "ja" ? "フィードバック" : "Feedback",
			exact: true,
		});
		await button.focus();
		await page.keyboard.press("Enter");
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole("textbox")).toHaveCount(1);
		await expect(dialog).toContainText(
			locale === "ja" ? "Sentryへ送信" : "sent to Sentry",
		);
		await expect(
			dialog.getByRole("button", { name: /screenshot|スクリーンショット/iu }),
		).toHaveCount(0);
		await dialog.getByRole("textbox").fill("Deliberate feedback test");
		await dialog
			.getByRole("button", {
				name: locale === "ja" ? "送信" : "Send feedback",
				exact: true,
			})
			.click();
		await expect(dialog).toContainText(
			locale === "ja" ? "送信できませんでした" : "could not be sent",
		);
		feedbackFails = false;
		await dialog
			.getByRole("button", {
				name: locale === "ja" ? "送信" : "Send feedback",
				exact: true,
			})
			.click();
		await expect(
			page.getByText(
				locale === "ja"
					? "フィードバックを送信しました。"
					: "Thank you. Your feedback was sent.",
				{ exact: true },
			),
		).toBeVisible();
		expect(
			envelopes.some((body) => body.includes("Deliberate feedback test")),
		).toBe(true);
		expect(envelopes.join("")).not.toContain("rum@example.test");
		expect(envelopes.join("")).not.toContain("RUM fixture");
		expect(violations).toEqual([]);
	});
}

import { expect, test } from "@playwright/test";
import { inflateSync } from "node:zlib";

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

/**
 * Shared Auth0 login helper for memlab scenarios.
 * Reuses the E2E_AUTH0_USERNAME / E2E_AUTH0_PASSWORD env vars used by Playwright.
 */

async function loginWithAuth0(page) {
	const username = process.env.E2E_AUTH0_USERNAME;
	const password = process.env.E2E_AUTH0_PASSWORD;

	if (!username || !password) {
		throw new Error(
			"E2E_AUTH0_USERNAME and E2E_AUTH0_PASSWORD must be set for memlab scenarios",
		);
	}

	await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
	await page.waitForFunction(() => /auth0/i.test(window.location.hostname), {
		timeout: 30_000,
	});

	await page.waitForSelector('input[name="username"], input[type="email"]', {
		timeout: 30_000,
	});
	await page.type(
		'input[name="username"], input[type="email"]',
		username,
		{ delay: 10 },
	);
	await page.type('input[name="password"]', password, { delay: 10 });

	await Promise.all([
		page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60_000 }),
		page.click('button[type="submit"]'),
	]);

	await page.waitForFunction(
		() => window.location.hostname === "localhost",
		{ timeout: 30_000 },
	);
}

module.exports = { loginWithAuth0 };

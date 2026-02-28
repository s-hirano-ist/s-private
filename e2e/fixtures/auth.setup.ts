import { test as setup } from "@playwright/test";

setup("authenticate", async ({ page }) => {
	const username = process.env.E2E_AUTH0_USERNAME;
	const password = process.env.E2E_AUTH0_PASSWORD;

	if (!username || !password) {
		throw new Error(
			"E2E_AUTH0_USERNAME and E2E_AUTH0_PASSWORD must be set in environment variables",
		);
	}

	await page.goto("/");
	await page.waitForURL(/auth0/, { timeout: 15_000 });

	await page.getByLabel("Email address").fill(username);
	await page.getByLabel("Password").fill(password);
	await page.getByRole("button", { name: "Continue" }).click();

	await page.waitForURL("**/main/**", { timeout: 30_000 });

	await page.context().storageState({ path: ".auth/user.json" });
});

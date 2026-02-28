import { expect, test } from "@playwright/test";
import { resetNetwork, setNetworkConditions } from "../helpers/cdp-network";
import { ROUTES, SELECTORS } from "../helpers/selectors";

test.describe("Network delay resilience", () => {
	test.afterEach(async ({ page }) => {
		await resetNetwork(page);
	});

	test("page loads under 3G conditions with loading state", async ({
		page,
	}) => {
		await setNetworkConditions(page, "slow3G");
		await page.goto(ROUTES.articles, { waitUntil: "commit" });

		// Content should eventually appear even on slow network
		await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });

		// Error boundary should NOT be triggered by slow network
		await expect(page.locator(SELECTORS.statusCodeView)).not.toBeVisible();
	});

	test("tab navigation completes under 3G without error boundary", async ({
		page,
	}) => {
		await page.goto(ROUTES.articles);
		await expect(page.locator("main")).toBeVisible();

		await setNetworkConditions(page, "slow3G");

		await page.locator(SELECTORS.navNotes).click();
		await page.waitForURL(/notes/, { timeout: 30_000 });

		await expect(page.locator(SELECTORS.statusCodeView)).not.toBeVisible();
		await expect(page.locator("main")).toBeVisible();
	});

	test("form submission shows loading state on slow network", async ({
		page,
	}) => {
		await page.goto(ROUTES.articles);
		await expect(page.locator("main")).toBeVisible();

		await setNetworkConditions(page, "slow3G");

		const form = page.locator("form").first();
		if (await form.isVisible()) {
			const submitButton = form.locator('button[type="submit"]');
			if (await submitButton.isVisible()) {
				await submitButton.click();

				// After submit, either loading indicator or toast should appear
				const loadingOrToast = page
					.locator(SELECTORS.toast)
					.or(page.locator('[data-pending="true"]'))
					.or(page.locator("button:disabled"));

				await expect(loadingOrToast.first()).toBeVisible({
					timeout: 30_000,
				});
			}
		}
	});
});

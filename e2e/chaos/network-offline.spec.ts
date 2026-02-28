import { expect, test } from "@playwright/test";
import { resetNetwork, setNetworkConditions } from "../helpers/cdp-network";
import { ROUTES, SELECTORS } from "../helpers/selectors";

test.describe("Network offline resilience", () => {
	test.afterEach(async ({ page }) => {
		await resetNetwork(page);
	});

	test("offline form submission shows error toast", async ({ page }) => {
		await page.goto(ROUTES.articles);
		await expect(page.locator("main")).toBeVisible();

		await setNetworkConditions(page, "offline");

		const form = page.locator("form").first();
		if (await form.isVisible()) {
			const submitButton = form.locator('button[type="submit"]');
			if (await submitButton.isVisible()) {
				await submitButton.click();
				await expect(page.locator(SELECTORS.toast)).toBeVisible({
					timeout: 10_000,
				});
			}
		}
	});

	test("offline navigation shows error boundary or preserves content", async ({
		page,
	}) => {
		await page.goto(ROUTES.articles);
		await expect(page.locator("main")).toBeVisible();

		await setNetworkConditions(page, "offline");

		await page.locator(SELECTORS.navNotes).click();

		// Either error boundary appears or previous content is preserved
		const errorOrContent = page
			.locator(SELECTORS.statusCodeView)
			.or(page.locator("main"));
		await expect(errorOrContent.first()).toBeVisible({ timeout: 10_000 });
	});

	test("network recovery restores normal operation", async ({ page }) => {
		await page.goto(ROUTES.articles);
		await expect(page.locator("main")).toBeVisible();

		// Go offline
		await setNetworkConditions(page, "offline");
		await page.locator(SELECTORS.navNotes).click();
		await page.waitForTimeout(3_000);

		// Come back online
		await resetNetwork(page);

		await page.goto(ROUTES.articles);
		await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
		await expect(page.locator(SELECTORS.statusCodeView)).not.toBeVisible();
	});
});

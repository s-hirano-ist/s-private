import { expect, test } from "@playwright/test";
import { ROUTES, SELECTORS } from "../helpers/selectors";

test.describe("Error boundary resilience", () => {
	test("RSC 500 response triggers error boundary with status code", async ({
		page,
	}) => {
		// Intercept RSC payload requests and return 500
		await page.route("**/articles*", (route) => {
			const headers = route.request().headers();
			if (headers["rsc"] || headers["next-router-state-tree"]) {
				return route.fulfill({
					status: 500,
					contentType: "text/plain",
					body: "Internal Server Error",
				});
			}
			return route.continue();
		});

		await page.goto(ROUTES.articles);

		// Navigate to trigger RSC fetch
		await page.locator(SELECTORS.navNotes).click();
		await page.waitForLoadState("networkidle");

		// Navigate back to articles (intercepted with 500)
		await page.locator(SELECTORS.navArticles).click();

		await expect(page.locator(SELECTORS.statusCodeView)).toBeVisible({
			timeout: 10_000,
		});
		await expect(page.locator(SELECTORS.statusCodeView)).toContainText("500");
	});

	test("Try again button recovers from error state", async ({ page }) => {
		let interceptCount = 0;

		// Intercept only the first RSC request with 500
		await page.route("**/articles*", (route) => {
			const headers = route.request().headers();
			if (headers["rsc"] || headers["next-router-state-tree"]) {
				interceptCount++;
				if (interceptCount <= 1) {
					return route.fulfill({
						status: 500,
						contentType: "text/plain",
						body: "Internal Server Error",
					});
				}
			}
			return route.continue();
		});

		await page.goto(ROUTES.notes);
		await expect(page.locator("main")).toBeVisible();

		// Navigate to articles (triggers 500)
		await page.locator(SELECTORS.navArticles).click();

		await expect(page.locator(SELECTORS.statusCodeView)).toBeVisible({
			timeout: 10_000,
		});

		// Click Try again (second request goes through)
		await page.locator(SELECTORS.tryAgainButton).click();

		await expect(page.locator(SELECTORS.statusCodeView)).not.toBeVisible({
			timeout: 10_000,
		});
	});

	test("Server Action POST 500 shows toast instead of error boundary", async ({
		page,
	}) => {
		await page.goto(ROUTES.articles);
		await expect(page.locator("main")).toBeVisible();

		// Intercept Server Action POST requests with 500
		await page.route("**/articles", (route) => {
			if (route.request().method() === "POST") {
				return route.fulfill({
					status: 500,
					contentType: "text/plain",
					body: "Internal Server Error",
				});
			}
			return route.continue();
		});

		const form = page.locator("form").first();
		if (await form.isVisible()) {
			const submitButton = form.locator('button[type="submit"]');
			if (await submitButton.isVisible()) {
				await submitButton.click();

				// Server Action error should show toast, NOT error boundary
				await expect(page.locator(SELECTORS.toast)).toBeVisible({
					timeout: 10_000,
				});
				await expect(page.locator(SELECTORS.statusCodeView)).not.toBeVisible();
			}
		}
	});
});

/**
 * Scenario: Open and close the SearchDrawer.
 * Detects DOM reference leaks from Drawer component lifecycle.
 */
const { loginWithAuth0 } = require("../helpers/auth.cjs");

module.exports = {
	url: () => "http://localhost:3000/ja/articles",

	setup: async (page) => {
		await loginWithAuth0(page);
	},

	action: async (page) => {
		const searchButton = await page.waitForSelector(
			'[data-testid="search-button"]',
		);
		await searchButton?.click();
		await page.waitForSelector('[data-slot="drawer-content"]');
	},

	back: async (page) => {
		await page.keyboard.press("Escape");
		await page.waitForFunction(
			() => !document.querySelector('[data-slot="drawer-content"]'),
		);
	},
};

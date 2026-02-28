import type { IScenario, Page } from "@memlab/core";

/**
 * Scenario: Open and close the SearchDrawer.
 * Detects DOM reference leaks from Drawer component lifecycle.
 */
const scenario: IScenario = {
	url: () => "http://localhost:3000/ja/main/articles",

	action: async (page: Page) => {
		const searchButton = await page.waitForSelector(
			'[data-testid="search-button"]',
		);
		await searchButton?.click();
		await page.waitForSelector('[data-slot="drawer-content"]');
	},

	back: async (page: Page) => {
		await page.keyboard.press("Escape");
		await page.waitForFunction(
			() => !document.querySelector('[data-slot="drawer-content"]'),
		);
	},
};

export default scenario;

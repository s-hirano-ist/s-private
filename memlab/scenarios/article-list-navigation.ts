import type { IScenario, Page } from "@memlab/core";

/**
 * Scenario: Navigate between article tabs (articles → notes → articles).
 * Detects IntersectionObserver leaks from useInfiniteScroll hook.
 */
const scenario: IScenario = {
	url: () => "http://localhost:3000/ja/main/articles",

	action: async (page: Page) => {
		const notesTab = await page.waitForSelector('nav a[href*="/notes"]');
		await notesTab?.click();
		await page.waitForNavigation({ waitUntil: "networkidle0" });
	},

	back: async (page: Page) => {
		const articlesTab = await page.waitForSelector('nav a[href*="/articles"]');
		await articlesTab?.click();
		await page.waitForNavigation({ waitUntil: "networkidle0" });
	},
};

export default scenario;

/**
 * Scenario: Navigate between article tabs (articles → notes → articles).
 * Detects IntersectionObserver leaks from useInfiniteScroll hook.
 */
module.exports = {
	url: () => "http://localhost:3000/ja/main/articles",

	action: async (page) => {
		const notesTab = await page.waitForSelector('nav a[href*="/notes"]');
		await notesTab?.click();
		await page.waitForNavigation({ waitUntil: "networkidle0" });
	},

	back: async (page) => {
		const articlesTab = await page.waitForSelector('nav a[href*="/articles"]');
		await articlesTab?.click();
		await page.waitForNavigation({ waitUntil: "networkidle0" });
	},
};

import { createPushoverService } from "@s-hirano-ist/s-notification";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { JSDOM, VirtualConsole } from "jsdom";
import { join } from "path";

const PUSHOVER_URL = process.env.PUSHOVER_URL;
const PUSHOVER_USER_KEY = process.env.PUSHOVER_USER_KEY;
const PUSHOVER_APP_TOKEN = process.env.PUSHOVER_APP_TOKEN;

if (!PUSHOVER_URL || !PUSHOVER_USER_KEY || !PUSHOVER_APP_TOKEN)
	throw new Error("ENV not set.");

const notificationService = createPushoverService({
	url: PUSHOVER_URL,
	userKey: PUSHOVER_USER_KEY,
	appToken: PUSHOVER_APP_TOKEN,
});

interface ArticleItem {
	title: string;
	url: string;
	quote?: string;
	ogImageUrl?: string;
	ogTitle?: string;
	ogDescription?: string;
	skip?: boolean;
}

interface ArticlesJson {
	heading: string;
	description: string;
	body: ArticleItem[];
}

// REF: https://zenn.dev/littleforest/articles/scrape-og-tags
function extractOgpData(metaElements: HTMLMetaElement[]) {
	return metaElements
		.filter((element: Element) => element.hasAttribute("property"))
		.reduce((previous: Record<string, string>, current: Element) => {
			const property = current.getAttribute("property")?.trim();
			const content = current.getAttribute("content");
			if (!property || !content) return previous;
			previous[property] = content;
			return previous;
		}, {});
}

async function getOgTags(
	url: string,
): Promise<{ ogImageUrl?: string; ogTitle?: string; ogDescription?: string }> {
	try {
		console.log(`Fetching OG tags for: ${url}`);

		// REF: https://github.com/jsdom/jsdom#virtual-consoles
		const virtualConsole = new VirtualConsole();
		const dom = await JSDOM.fromURL(url, { virtualConsole });
		virtualConsole.on("error", () => {});
		virtualConsole.on("warn", () => {});
		virtualConsole.on("info", () => {});
		virtualConsole.on("dir", () => {});

		const meta = dom.window.document.head.querySelectorAll("meta");
		const ogTags = extractOgpData([...meta]);

		const ogImageUrl = ogTags?.["og:image"];
		const ogTitle = ogTags?.["og:title"];
		const ogDescription = ogTags?.["og:description"];

		return { ogImageUrl, ogTitle, ogDescription };
	} catch (error) {
		console.error(`Error fetching OG tags for ${url}:`);
		return {};
	}
}

async function processArticleFile(filePath: string): Promise<void> {
	try {
		const jsonContent = readFileSync(filePath, "utf-8");
		const articleData: ArticlesJson = JSON.parse(jsonContent);

		console.log(`Processing ${filePath}...`);

		for (let i = 0; i < articleData.body.length; i++) {
			const item = articleData.body[i];

			// Skip if OG tags already exist
			if (item.ogImageUrl || item.ogTitle || item.ogDescription || item.skip) {
				// console.log(`Skipping ${item.url} - OG tags already exist`);
				continue;
			}

			const ogTags = await getOgTags(item.url);

			// Only add properties if they have values
			if (ogTags.ogImageUrl) item.ogImageUrl = ogTags.ogImageUrl;
			else console.warn(`No OG image found for ${item.url}`);

			if (ogTags.ogTitle) item.ogTitle = ogTags.ogTitle;
			else console.warn(`No OG title found for ${item.url}`);

			if (ogTags.ogDescription) item.ogDescription = ogTags.ogDescription;
			else console.warn(`No OG description found for ${item.url}`);

			// Add a small delay to avoid overwhelming servers
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		// Write back to file
		writeFileSync(
			filePath,
			JSON.stringify(articleData, null, "\t") + "\n",
			"utf-8",
		);
		console.log(`✅ Completed processing ${filePath}`);
	} catch (error) {
		console.error(`Error processing ${filePath}:`, error);
	}
}

async function main(): Promise<void> {
	const articleDir = join(process.cwd(), "json", "article");

	try {
		const files = readdirSync(articleDir).filter((file) =>
			file.endsWith(".json"),
		);

		console.log(`Found ${files.length} JSON files to process`);

		for (const file of files) {
			const filePath = join(articleDir, file);
			await processArticleFile(filePath);
		}

		console.log("🎉 All files processed successfully!");
		await notificationService.notifyInfo("update-json-articles completed", {
			caller: "update-json-articles",
		});
	} catch (error) {
		console.error("Error in main process:", error);
		await notificationService.notifyError(
			`update-json-articles failed: ${error}`,
			{
				caller: "update-json-articles",
			},
		);
		process.exit(1);
	}
}

if (import.meta.main) {
	main();
}

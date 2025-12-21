import { readdirSync, readFileSync, writeFileSync } from "fs";
import { JSDOM, VirtualConsole } from "jsdom";
import { join } from "path";

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
	} catch (_error) {
		console.error(`Error fetching OG tags for ${url}`);
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

			if (item.ogImageUrl || item.ogTitle || item.ogDescription || item.skip) {
				continue;
			}

			const ogTags = await getOgTags(item.url);

			if (ogTags.ogImageUrl) item.ogImageUrl = ogTags.ogImageUrl;
			else console.warn(`No OG image found for ${item.url}`);

			if (ogTags.ogTitle) item.ogTitle = ogTags.ogTitle;
			else console.warn(`No OG title found for ${item.url}`);

			if (ogTags.ogDescription) item.ogDescription = ogTags.ogDescription;
			else console.warn(`No OG description found for ${item.url}`);

			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		writeFileSync(
			filePath,
			`${JSON.stringify(articleData, null, "\t")}\n`,
			"utf-8",
		);
		console.log(`Completed processing ${filePath}`);
	} catch (error) {
		console.error(`Error processing ${filePath}:`, error);
	}
}

export async function updateJsonArticles(): Promise<void> {
	const articleDir = join(process.cwd(), "json", "article");

	const files = readdirSync(articleDir).filter((file) =>
		file.endsWith(".json"),
	);

	console.log(`Found ${files.length} JSON files to process`);

	for (const file of files) {
		const filePath = join(articleDir, file);
		await processArticleFile(filePath);
	}

	console.log("All files processed successfully!");
}

#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPushoverService } from "@s-hirano-ist/s-notification";
import iconv from "iconv-lite";
import { JSDOM, VirtualConsole } from "jsdom";

type ArticleItem = {
	title: string;
	url: string;
	quote?: string;
	ogImageUrl?: string;
	ogTitle?: string;
	ogDescription?: string;
	skip?: boolean;
};

type ArticlesJson = {
	heading: string;
	description: string;
	body: ArticleItem[];
};

function normalizeCharset(charset: string): string {
	const normalized = charset.toLowerCase().replace(/[^a-z0-9]/g, "");
	const mapping: Record<string, string> = {
		shiftjis: "Shift_JIS",
		sjis: "Shift_JIS",
		xsjis: "Shift_JIS",
		eucjp: "EUC-JP",
		xeucjp: "EUC-JP",
	};
	return mapping[normalized] || charset;
}

function detectCharset(headers: Headers, buffer: Buffer): string {
	// 1. Content-Type ヘッダーから検出
	const contentType = headers.get("content-type") || "";
	const headerMatch = contentType.match(/charset=([^\s;]+)/i);
	if (headerMatch) return normalizeCharset(headerMatch[1]);

	// 2. HTML meta タグから検出（ASCII範囲で仮デコード）
	const preview = buffer
		.subarray(0, Math.min(4096, buffer.length))
		.toString("ascii");

	// <meta charset="...">
	const metaCharset = preview.match(/<meta\s{1,200}charset=["']?([^"'\s>]+)/i);
	if (metaCharset) return normalizeCharset(metaCharset[1]);

	// <meta http-equiv="Content-Type" content="...; charset=...">
	const metaHttpEquiv = preview.match(
		/<meta[^>]{1,500}http-equiv=["']?Content-Type["']?[^>]{1,500}content=["'][^"']{0,500}charset=([^"'\s;]+)/i,
	);
	if (metaHttpEquiv) return normalizeCharset(metaHttpEquiv[1]);

	return "utf-8";
}

// REF: https://zenn.dev/littleforest/articles/scrape-og-tags
function extractOgpData(metaElements: HTMLMetaElement[]) {
	return metaElements
		.filter((element: Element) => element.hasAttribute("property"))
		.reduce(
			(previous: Record<string, string>, current: Element) => {
				const property = current.getAttribute("property")?.trim();
				const content = current.getAttribute("content");
				if (!property || !content) return previous;
				previous[property] = content;
				return previous;
			},
			{} as Record<string, string>,
		);
}

async function getOgTags(
	url: string,
): Promise<{ ogImageUrl?: string; ogTitle?: string; ogDescription?: string }> {
	try {
		console.log(`Fetching OG tags for: ${url}`);

		const response = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
			},
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const buffer = Buffer.from(await response.arrayBuffer());
		const charset = detectCharset(response.headers, buffer);
		const html = iconv.decode(buffer, charset);

		// REF: https://github.com/jsdom/jsdom#virtual-consoles
		const virtualConsole = new VirtualConsole();
		const dom = new JSDOM(html, { virtualConsole });
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
			`${JSON.stringify(articleData, null, "\t")}\n`,
			"utf-8",
		);
		console.log(`Completed processing ${filePath}`);
	} catch (error) {
		console.error(`Error processing ${filePath}:`, error);
	}
}

async function main(): Promise<void> {
	const env = {
		PUSHOVER_URL: process.env.PUSHOVER_URL,
		PUSHOVER_USER_KEY: process.env.PUSHOVER_USER_KEY,
		PUSHOVER_APP_TOKEN: process.env.PUSHOVER_APP_TOKEN,
	} as const;

	if (Object.values(env).some((v) => !v)) {
		throw new Error("Required environment variables are not set.");
	}

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

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

		console.log("All files processed successfully!");
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

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

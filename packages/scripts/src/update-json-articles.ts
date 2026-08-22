#!/usr/bin/env node
import { createPushoverService } from "@s-hirano-ist/s-notification";
import * as cheerio from "cheerio";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodeHtml } from "./lib/html-charset.ts";

type ArticleItem = {
	ogDescription?: string;
	ogImageUrl?: string;
	ogTitle?: string;
	quote?: string;
	skip?: boolean;
	title: string;
	url: string;
};

type ArticlesJson = {
	body: ArticleItem[];
	description: string;
	heading: string;
};

async function getOgTags(
	url: string,
): Promise<{ ogDescription?: string; ogImageUrl?: string; ogTitle?: string }> {
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
		const html = decodeHtml(response.headers, buffer);

		const $ = cheerio.load(html);
		const ogTags: Record<string, string> = {};
		$("meta[property]").each((_, el) => {
			const property = $(el).attr("property")?.trim();
			const content = $(el).attr("content");
			if (property && content) {
				ogTags[property] = content;
			}
		});

		const ogImageUrl = ogTags["og:image"];
		const ogTitle = ogTags["og:title"];
		const ogDescription = ogTags["og:description"];

		return { ogImageUrl, ogTitle, ogDescription };
	} catch (error) {
		console.error(`Error fetching OG tags for ${url}:`, error);
		return {};
	}
}

async function processArticleFile(filePath: string): Promise<void> {
	try {
		const jsonContent = readFileSync(filePath, "utf-8");
		const articleData = JSON.parse(jsonContent) as ArticlesJson;

		console.log(`Processing ${filePath}...`);

		for (const item of articleData.body) {
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
			await new Promise((resolve) => {
				setTimeout(resolve, 1000);
			});
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
			`update-json-articles failed: ${String(error)}`,
			{
				caller: "update-json-articles",
			},
		);
		process.exit(1);
	}
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});

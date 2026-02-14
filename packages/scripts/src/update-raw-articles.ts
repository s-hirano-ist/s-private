#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createPushoverService } from "@s-hirano-ist/s-notification";
import iconv from "iconv-lite";
import TurndownService from "turndown";

const FETCHED_URLS_FILE = "fetched_urls.txt";
const JSON_DIR = "json/article";
const OUTPUT_DIR = "raw/article";

async function loadFetchedUrls(): Promise<Set<string>> {
	try {
		if (existsSync(FETCHED_URLS_FILE)) {
			const content = await readFile(FETCHED_URLS_FILE, "utf-8");
			return new Set(content.split("\n").filter((url) => url.trim()));
		}
	} catch (error) {
		console.error("Error loading fetched URLs:", error);
	}
	return new Set();
}

async function saveFetchedUrls(urls: Set<string>): Promise<void> {
	const sortedUrls = Array.from(urls).sort();
	await writeFile(FETCHED_URLS_FILE, sortedUrls.join("\n"), "utf-8");
}

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
	const preview = buffer.subarray(0, Math.min(4096, buffer.length)).toString("ascii");

	// <meta charset="...">
	const metaCharset = preview.match(/<meta\s+charset=["']?([^"'\s>]+)/i);
	if (metaCharset) return normalizeCharset(metaCharset[1]);

	// <meta http-equiv="Content-Type" content="...; charset=...">
	const metaHttpEquiv = preview.match(
		/<meta[^>]+http-equiv=["']?Content-Type["']?[^>]+content=["'][^"']*charset=([^"'\s;]+)/i,
	);
	if (metaHttpEquiv) return normalizeCharset(metaHttpEquiv[1]);

	return "utf-8";
}

async function fetchWebsiteMarkdown(url: string): Promise<string> {
	try {
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

		const turndownService = new TurndownService({
			headingStyle: "atx",
			codeBlockStyle: "fenced",
			bulletListMarker: "-",
			strongDelimiter: "**",
			emDelimiter: "_",
		});

		turndownService.remove(["script", "style", "nav", "footer", "aside"]);

		turndownService.addRule("preserveLinks", {
			filter: ["a"],
			replacement: (content, node) => {
				const element = node as HTMLAnchorElement;
				const href = element.getAttribute("href");
				if (!href) return content;

				if (href.startsWith("http") || href.startsWith("https")) {
					return `[${content}](${href})`;
				}
				try {
					const absoluteUrl = new URL(href, url).href;
					return `[${content}](${absoluteUrl})`;
				} catch {
					return content;
				}
			},
		});

		turndownService.addRule("preserveImages", {
			filter: ["img"],
			replacement: (_content, node) => {
				const element = node as HTMLImageElement;
				const src = element.getAttribute("src");
				const alt = element.getAttribute("alt") || "";
				if (!src) return "";

				if (src.startsWith("http") || src.startsWith("https")) {
					return `![${alt}](${src})`;
				}
				try {
					const absoluteUrl = new URL(src, url).href;
					return `![${alt}](${absoluteUrl})`;
				} catch {
					return "";
				}
			},
		});

		const markdown = turndownService.turndown(html);
		return markdown.trim();
	} catch (error) {
		console.error(`Failed to fetch ${url}:`, error);
		return "";
	}
}

type ArticleItem = {
	title: string;
	quote: string;
	url: string;
	skip?: boolean;
};

type ArticlesData = {
	heading: string;
	description: string;
	body: ArticleItem[];
};

async function jsonToMarkdown(
	jsonFile: string,
	fetchedUrls: Set<string>,
): Promise<void> {
	const rawData = await readFile(jsonFile, "utf-8");
	const data: ArticlesData = JSON.parse(rawData);

	const bodyList = data.body || [];

	if (!existsSync(OUTPUT_DIR)) {
		await mkdir(OUTPUT_DIR, { recursive: true });
	}

	for (const item of bodyList) {
		const { title, quote, url, skip } = item;
		try {
			if (fetchedUrls.has(url) || skip) {
				continue;
			}

			const websiteText = await fetchWebsiteMarkdown(url);

			if (!websiteText) {
				continue;
			}

			const strippedUrl = url.replace(/^https?:\/\//, "");
			const safeUrl = encodeURIComponent(strippedUrl);
			const outputFilename = `${safeUrl}.md`;
			const outputPath = path.join(OUTPUT_DIR, outputFilename);

			const markdownContent = `# [${title}](${url})

---

## Quote

${quote}

## Content

${websiteText}
`;

			await writeFile(outputPath, markdownContent, "utf-8");
			console.log(`Exported: ${outputPath}`);

			fetchedUrls.add(url);
		} catch (_error) {
			console.error("Error on file:", url);
		}
	}
}

async function main() {
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

	try {
		const fetchedUrls = await loadFetchedUrls();

		const jsonFiles = await readdir(JSON_DIR);
		const jsonFilePaths = jsonFiles
			.filter((file) => file.endsWith(".json"))
			.map((file) => path.join(JSON_DIR, file));

		for (const jsonFile of jsonFilePaths) {
			console.log(`Processing: ${jsonFile}`);
			await jsonToMarkdown(jsonFile, fetchedUrls);
		}

		await saveFetchedUrls(fetchedUrls);
		await notificationService.notifyInfo("update-raw-articles completed", {
			caller: "update-raw-articles",
		});
	} catch (error) {
		console.error("Error in main process:", error);
		await notificationService.notifyError(
			`update-raw-articles failed: ${error}`,
			{
				caller: "update-raw-articles",
			},
		);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

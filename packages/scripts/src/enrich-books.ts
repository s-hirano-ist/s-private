#!/usr/bin/env node
/**
 * markdown/book/*.md の frontmatter について、毎回 Google Books API を呼び出して
 * google* および title を最新状態に更新するスクリプト。
 *
 * API が title を返した場合は frontmatter.title を上書きする。
 * notFound (API が volume を返さない) の場合は手動入力 title を保持する。
 * markdown 本文 (h1 含む) には触れないため、自己入力の h1 はそのまま維持される。
 */
import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { books as googleBooksApis } from "@googleapis/books";
import { glob } from "glob";
import matter from "gray-matter";
import yaml from "js-yaml";

const NO_IMG_SRC = "https://s-hirano.com/notFound.png";
const NOT_FOUND_HREF = "https://s-hirano.com/404";
const API_INTERVAL_MS = 600;

function dumpFrontmatter(data: Record<string, unknown>): string {
	return yaml.dump(data, {
		lineWidth: -1,
		forceQuotes: false,
		noRefs: true,
	});
}

const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
	const dryRun = process.argv.includes("--dry-run");
	const contentsPath = process.env.S_CONTENTS_PATH ?? process.cwd();
	const bookDir = join(contentsPath, "markdown", "book");

	const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
	if (!apiKey) {
		throw new Error("GOOGLE_BOOKS_API_KEY is not set");
	}

	const api = googleBooksApis({ version: "v1", auth: apiKey });

	const files = await glob(`${bookDir}/*.md`);
	console.log(
		`📁 ${files.length} 件の markdown を検出しました。${dryRun ? " (dry-run)" : ""}`,
	);

	let enrichedCount = 0;
	let errorCount = 0;

	for (const filePath of files.sort()) {
		const fileName = basename(filePath);
		const isbn = basename(filePath, ".md");

		try {
			const raw = await readFile(filePath, "utf8");
			const parsed = matter(raw);
			const data = parsed.data as Record<string, unknown>;

			console.log(`🔍 ${fileName}: Google Books API 問い合わせ中...`);
			const book = await api.volumes.list({ q: `isbn:${isbn}` });
			await sleep(API_INTERVAL_MS);

			if (book.status !== 200) {
				throw new Error(`Google Books API status ${book.status}`);
			}

			const volume = book.data.items?.[0]?.volumeInfo;
			const httpsImgSrc = (volume?.imageLinks?.thumbnail ?? NO_IMG_SRC).replace(
				"http://",
				"https://",
			);
			const httpsHref = (volume?.infoLink ?? NOT_FOUND_HREF).replace(
				"http://",
				"https://",
			);

			const next: Record<string, unknown> = {
				...data,
				googleSubtitle: volume?.subtitle ?? "",
				googleAuthors: volume?.authors ?? [],
				googleDescription: volume?.description ?? "No description",
				googleImgSrc: httpsImgSrc,
				googleHref: httpsHref,
			};

			// API が title を返した場合のみ frontmatter.title を上書き。
			// notFound の場合は手動入力 title を保持する。
			if (typeof volume?.title === "string" && volume.title !== "") {
				next.title = volume.title;
			}

			const body = parsed.content.replace(/^\n+/, "");
			const newContent = `---\n${dumpFrontmatter(next)}---\n\n${body}`;

			if (dryRun) {
				console.log("  [dry-run] 書き込みスキップ");
			} else {
				await writeFile(filePath, newContent, "utf8");
				console.log(`  ✅ ${volume?.title ?? "(title not found)"}`);
			}
			enrichedCount++;
		} catch (error) {
			console.error(`❌ ${fileName}:`, error);
			errorCount++;
		}
	}

	console.log(
		`\n📊 結果: 更新 ${enrichedCount} 件, エラー ${errorCount} 件${dryRun ? " (dry-run)" : ""}`,
	);
}

main().catch((error) => {
	console.error("❌ エラーが発生しました:", error);
	process.exit(1);
});

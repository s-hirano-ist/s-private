#!/usr/bin/env node
/**
 * markdown/book/*.md の frontmatter を集約し、s-public が読み込む
 * data.gen.json 形式で出力するスクリプト。
 *
 * 出力先は引数 --out <path> または env S_PUBLIC_PATH で指定する。
 * どちらも無ければ ../s-public/src/data/book/data.gen.json にフォールバック。
 */
import { readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { glob } from "glob";
import matter from "gray-matter";

type BookFrontmatter = {
	description?: string;
	rating?: number | null;
	tags?: string[];
	googleTitle?: string | null;
	googleSubtitle?: string | null;
	googleAuthors?: string[];
	googleDescription?: string | null;
	googleImgSrc?: string | null;
	googleHref?: string | null;
};

type BookEntry = {
	ISBN: string;
	title: string;
	googleTitle: string;
	googleSubtitle: string;
	googleAuthors: string[];
	googleDescription: string;
	googleImgSrc: string;
	googleHref: string;
	tags: string[];
	rating: number;
};

function parseOutArg(): string | undefined {
	const idx = process.argv.indexOf("--out");
	if (idx >= 0 && idx + 1 < process.argv.length) {
		return process.argv[idx + 1];
	}
	return undefined;
}

async function main(): Promise<void> {
	const contentsPath = process.env.S_CONTENTS_PATH ?? process.cwd();
	const bookDir = join(contentsPath, "markdown", "book");

	const outArg = parseOutArg();
	const sPublicPath =
		outArg ??
		(process.env.S_PUBLIC_PATH
			? join(process.env.S_PUBLIC_PATH, "src/data/book/data.gen.json")
			: resolve(contentsPath, "../s-public/src/data/book/data.gen.json"));

	const files = await glob(`${bookDir}/*.md`);
	console.log(`📁 ${files.length} 件の markdown を検出しました。`);

	const entries: BookEntry[] = [];
	let skippedCount = 0;

	for (const filePath of files.sort()) {
		const fileName = basename(filePath);
		const isbn = basename(filePath, ".md");

		const raw = await readFile(filePath, "utf8");
		const parsed = matter(raw);
		const data = parsed.data as BookFrontmatter;

		if (data.rating == null || data.googleTitle == null) {
			console.warn(
				`⚠️  ${fileName}: rating または googleTitle が未設定のためスキップします。`,
			);
			skippedCount++;
			continue;
		}

		entries.push({
			ISBN: isbn,
			title: data.description ?? "",
			googleTitle: data.googleTitle ?? "",
			googleSubtitle: data.googleSubtitle ?? "",
			googleAuthors: data.googleAuthors ?? [],
			googleDescription: data.googleDescription ?? "",
			googleImgSrc: data.googleImgSrc ?? "",
			googleHref: data.googleHref ?? "",
			tags: data.tags ?? [],
			rating: data.rating,
		});
	}

	entries.sort((a, b) => a.ISBN.localeCompare(b.ISBN));

	await writeFile(sPublicPath, JSON.stringify(entries), "utf8");
	console.log(`💾 書き出し: ${sPublicPath}`);
	console.log(
		`📊 結果: 出力 ${entries.length} 件, スキップ ${skippedCount} 件`,
	);
}

main().catch((error) => {
	console.error("❌ エラーが発生しました:", error);
	process.exit(1);
});

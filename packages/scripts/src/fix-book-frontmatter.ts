#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { glob } from "glob";
import matter from "gray-matter";
import yaml from "js-yaml";

const REQUIRED_KEYS = [
	"heading",
	"title",
	"draft",
	"rating",
	"tags",
	"googleSubtitle",
	"googleAuthors",
	"googleDescription",
	"googleImgSrc",
	"googleHref",
] as const;

const LEGACY_KEYS = ["googleTitle"] as const;

function dumpFrontmatter(data: Record<string, unknown>): string {
	return yaml.dump(data, {
		lineWidth: -1,
		forceQuotes: false,
		noRefs: true,
	});
}

function extractTitleFromContent(content: string): string | null {
	const match = content.match(/^# (.+)$/m);
	return match ? match[1].trim() : null;
}

async function main(): Promise<void> {
	const dryRun = process.argv.includes("--dry-run");
	const contentsPath = process.env.S_CONTENTS_PATH ?? process.cwd();
	const bookDir = join(contentsPath, "markdown", "book");

	console.log(
		`markdown/book ディレクトリのfrontmatterを検証中...${dryRun ? " (dry-run)" : ""}\n`,
	);

	const files = await glob(`${bookDir}/*.md`);
	console.log(`検出ファイル数: ${files.length}\n`);

	let fixedCount = 0;
	let skippedCount = 0;
	let errorCount = 0;

	for (const filePath of files) {
		const fileName = basename(filePath);
		const isbn = basename(filePath, ".md");

		try {
			const raw = await readFile(filePath, "utf8");
			const parsed = matter(raw);
			const existing = parsed.data as Record<string, unknown>;

			const hasAllKeys = REQUIRED_KEYS.every((k) => Object.hasOwn(existing, k));
			const hasLegacyKeys = LEGACY_KEYS.some((k) => Object.hasOwn(existing, k));
			if (hasAllKeys && !hasLegacyKeys) {
				skippedCount++;
				continue;
			}

			// title: frontmatter.title を優先、無ければ本文 H1 にフォールバック
			let title = typeof existing.title === "string" ? existing.title : "";
			if (!title) {
				const h1 = extractTitleFromContent(parsed.content);
				if (!h1) {
					console.error(
						`⚠️ ${fileName}: title も H1 も見つかりません。スキップします。`,
					);
					errorCount++;
					continue;
				}
				title = h1;
			}

			const next: Record<string, unknown> = {
				heading: existing.heading ?? isbn,
				title,
				draft: existing.draft ?? false,
				rating: "rating" in existing ? existing.rating : null,
				tags: Array.isArray(existing.tags) ? existing.tags : [],
				googleSubtitle:
					"googleSubtitle" in existing ? existing.googleSubtitle : null,
				googleAuthors: Array.isArray(existing.googleAuthors)
					? existing.googleAuthors
					: [],
				googleDescription:
					"googleDescription" in existing ? existing.googleDescription : null,
				googleImgSrc: "googleImgSrc" in existing ? existing.googleImgSrc : null,
				googleHref: "googleHref" in existing ? existing.googleHref : null,
			};

			const body = parsed.content.replace(/^\n+/, "");
			const newContent = `---\n${dumpFrontmatter(next)}---\n\n${body}`;

			if (dryRun) {
				console.log(`🔍 [dry-run] 修正予定: ${fileName}`);
			} else {
				await writeFile(filePath, newContent, "utf8");
				console.log(`✅ 修正完了: ${fileName} (${title})`);
			}
			fixedCount++;
		} catch (error) {
			console.error(`❌ ${fileName}: ${error}`);
			errorCount++;
		}
	}

	console.log(
		`\n📊 結果: 修正 ${fixedCount} 件, スキップ ${skippedCount} 件, エラー ${errorCount} 件${dryRun ? " (dry-run)" : ""}`,
	);
}

main().catch((error) => {
	console.error("❌ エラーが発生しました:", error);
	process.exit(1);
});

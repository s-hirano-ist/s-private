#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { glob } from "glob";

function hasFrontmatter(content: string): boolean {
	return content.startsWith("---");
}

function extractTitleFromH1(content: string): string | null {
	const match = content.match(/^# (.+)$/m);
	return match ? match[1].trim() : null;
}

function generateFrontmatter(isbn: string, title: string): string {
	return [
		"---",
		`heading: ${isbn}`,
		`description: ${title}`,
		"draft: false",
		"---",
	].join("\n");
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
			const content = await readFile(filePath, "utf8");

			if (hasFrontmatter(content)) {
				skippedCount++;
				continue;
			}

			const title = extractTitleFromH1(content);
			if (!title) {
				console.error(
					`⚠️ ${fileName}: H1タイトルが見つかりません。スキップします。`,
				);
				errorCount++;
				continue;
			}

			const frontmatter = generateFrontmatter(isbn, title);
			const newContent = `${frontmatter}\n\n${content}`;

			if (dryRun) {
				console.log(`🔍 [dry-run] 修正予定: ${fileName}`);
				console.log(`   heading: ${isbn}`);
				console.log(`   description: ${title}`);
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

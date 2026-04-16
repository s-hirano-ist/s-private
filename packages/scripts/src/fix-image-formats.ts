#!/usr/bin/env node
import { stat, unlink } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { glob } from "glob";
import sharp from "sharp";

const WEBP_QUALITY = 80;

function isConvertibleImage(filePath: string): boolean {
	const ext = extname(filePath).toLowerCase();
	return [".jpg", ".jpeg", ".png"].includes(ext);
}

function getWebpOutputPath(filePath: string): string {
	const ext = extname(filePath);
	return `${filePath.slice(0, -ext.length)}.webp`;
}

async function convertToWebp(
	inputPath: string,
	outputPath: string,
): Promise<void> {
	await sharp(inputPath).webp({ quality: WEBP_QUALITY }).toFile(outputPath);
}

async function processDirectory(
	directory: string,
	label: string,
	dryRun: boolean,
): Promise<{ converted: number; skipped: number; errors: number }> {
	const files = await glob(`${directory}/*`);
	const convertible = files.filter(isConvertibleImage);

	console.log(
		`\n📁 ${label}: ${convertible.length} 件の変換対象を検出（全 ${files.length} ファイル中）`,
	);

	let converted = 0;
	let skipped = 0;
	let errors = 0;

	for (const filePath of convertible) {
		const fileName = basename(filePath);
		const outputPath = getWebpOutputPath(filePath);

		try {
			// 出力先が既に存在する場合はスキップ
			try {
				await stat(outputPath);
				console.log(`⏭️ スキップ（WebP既存）: ${fileName}`);
				skipped++;
				continue;
			} catch {
				// ファイルが存在しない場合は変換続行
			}

			if (dryRun) {
				console.log(
					`🔍 [dry-run] 変換予定: ${fileName} → ${basename(outputPath)}`,
				);
				converted++;
				continue;
			}

			await convertToWebp(filePath, outputPath);

			// 出力ファイルの存在とサイズを確認
			const outputStat = await stat(outputPath);
			if (outputStat.size === 0) {
				throw new Error("変換後のファイルサイズが0です");
			}

			await unlink(filePath);
			console.log(`✅ 変換完了: ${fileName} → ${basename(outputPath)}`);
			converted++;
		} catch (error) {
			console.error(`❌ ${fileName}: ${error}`);
			errors++;
		}
	}

	return { converted, skipped, errors };
}

async function main(): Promise<void> {
	const dryRun = process.argv.includes("--dry-run");
	const contentsPath = process.env.S_CONTENTS_PATH ?? process.cwd();

	console.log(`画像をWebPフォーマットに変換中...${dryRun ? " (dry-run)" : ""}`);

	const bookDir = join(contentsPath, "image", "book");
	const dumpDir = join(contentsPath, "image", "dump");

	console.log("📌 image/note/ はSVGファイルのためスキップします。");

	const bookResult = await processDirectory(bookDir, "image/book", dryRun);
	const dumpResult = await processDirectory(dumpDir, "image/dump", dryRun);

	const totalConverted = bookResult.converted + dumpResult.converted;
	const totalSkipped = bookResult.skipped + dumpResult.skipped;
	const totalErrors = bookResult.errors + dumpResult.errors;

	console.log(
		`\n📊 合計: 変換 ${totalConverted} 件, スキップ ${totalSkipped} 件, エラー ${totalErrors} 件${dryRun ? " (dry-run)" : ""}`,
	);

	if (totalErrors > 0) {
		process.exit(1);
	}
}

main().catch((error) => {
	console.error("❌ エラーが発生しました:", error);
	process.exit(1);
});

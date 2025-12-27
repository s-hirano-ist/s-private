#!/usr/bin/env node
import fs from "node:fs";
import { join } from "node:path";

type ArticleItem = {
	title: string;
	url: string;
	quote?: string;
	ogImageUrl?: string;
	ogTitle?: string;
	ogDescription?: string;
};

type ArticleFile = {
	heading: string;
	description: string;
	body: ArticleItem[];
};

type UrlOccurrence = {
	url: string;
	title: string;
	fileName: string;
	category: string;
};

type DuplicateUrl = {
	url: string;
	occurrences: UrlOccurrence[];
};

function getAllJsonFiles(directory: string): string[] {
	return fs
		.readdirSync(directory)
		.filter((file) => file.endsWith(".json") && file !== ".DS_Store");
}

function readArticleFile(filePath: string): ArticleFile {
	const fileContents = fs.readFileSync(filePath, "utf8");
	return JSON.parse(fileContents) as ArticleFile;
}

function findDuplicateUrls(): DuplicateUrl[] {
	const articleDirectory = join(process.cwd(), "json", "article");
	const jsonFiles = getAllJsonFiles(articleDirectory);

	console.log(`検索対象のJSONファイル数: ${jsonFiles.length}`);
	console.log(`ファイル一覧: ${jsonFiles.join(", ")}\n`);

	// URLの出現回数を追跡するマップ
	const urlMap = new Map<string, UrlOccurrence[]>();
	let totalUrls = 0;

	// 各JSONファイルを処理
	for (const fileName of jsonFiles) {
		const filePath = join(articleDirectory, fileName);

		try {
			const articleFile = readArticleFile(filePath);
			const category = articleFile.heading;

			console.log(
				`処理中: ${fileName} (カテゴリ: ${category}, 記事数: ${articleFile.body.length})`,
			);

			// 各記事のURLを処理
			for (const item of articleFile.body) {
				totalUrls++;

				const occurrence: UrlOccurrence = {
					url: item.url,
					title: item.title,
					fileName,
					category,
				};

				if (urlMap.has(item.url)) {
					urlMap.get(item.url)?.push(occurrence);
				} else {
					urlMap.set(item.url, [occurrence]);
				}
			}
		} catch (error) {
			console.error(`エラー: ${fileName} の読み込みに失敗しました:`, error);
		}
	}

	console.log(`\n合計URL数: ${totalUrls}`);
	console.log(`ユニークURL数: ${urlMap.size}`);

	// 重複URLを特定
	const duplicates: DuplicateUrl[] = [];

	for (const [url, occurrences] of urlMap.entries()) {
		if (occurrences.length > 1) {
			duplicates.push({
				url,
				occurrences,
			});
		}
	}

	return duplicates;
}

function displayResults(duplicates: DuplicateUrl[]): void {
	console.log("\n=== 重複URL検出結果 ===");
	console.log(`重複URL数: ${duplicates.length}\n`);

	if (duplicates.length === 0) {
		console.log("重複URLは見つかりませんでした！");
		return;
	}

	// 重複数でソート（多い順）
	duplicates.sort((a, b) => b.occurrences.length - a.occurrences.length);

	duplicates.forEach((duplicate, index) => {
		console.log(`${index + 1}. URL: ${duplicate.url}`);
		console.log(`   重複数: ${duplicate.occurrences.length}回`);

		duplicate.occurrences.forEach((occurrence, occIndex) => {
			console.log(
				`   ${occIndex + 1}) [${occurrence.category}] ${occurrence.fileName}`,
			);
			console.log(`      タイトル: ${occurrence.title}`);
		});

		console.log(""); // 空行
	});

	// サマリー統計
	const totalDuplicateOccurrences = duplicates.reduce(
		(sum, dup) => sum + dup.occurrences.length,
		0,
	);
	const wastedEntries = totalDuplicateOccurrences - duplicates.length;

	console.log("=== サマリー ===");
	console.log(`重複により無駄になっているエントリ数: ${wastedEntries}`);
	console.log(
		`最も多く重複しているURL: ${duplicates[0]?.occurrences.length || 0}回重複`,
	);

	// カテゴリ別の重複統計
	const categoryStats = new Map<string, number>();
	duplicates.forEach((dup) => {
		dup.occurrences.forEach((occ) => {
			categoryStats.set(
				occ.category,
				(categoryStats.get(occ.category) || 0) + 1,
			);
		});
	});

	console.log("\nカテゴリ別重複統計:");
	Array.from(categoryStats.entries())
		.sort((a, b) => b[1] - a[1])
		.forEach(([category, count]) => {
			console.log(`  ${category}: ${count}個の重複エントリ`);
		});
}

async function main(): Promise<void> {
	try {
		console.log("json/articleディレクトリ内のURL重複を検索中...\n");

		const duplicates = findDuplicateUrls();
		displayResults(duplicates);

		console.log("\n検索完了");
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

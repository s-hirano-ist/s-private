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
	skip?: boolean;
};

type ArticlesJson = {
	heading: string;
	description: string;
	body: ArticleItem[];
};

type ValidationIssue = {
	file: string;
	level: "error" | "warning";
	message: string;
};

function validateSchema(fileName: string, data: unknown): ValidationIssue[] {
	const issues: ValidationIssue[] = [];

	if (typeof data !== "object" || data === null || Array.isArray(data)) {
		issues.push({
			file: fileName,
			level: "error",
			message: "トップレベルがオブジェクトではありません",
		});
		return issues;
	}

	const obj = data as Record<string, unknown>;

	if (typeof obj.heading !== "string" || obj.heading.length === 0) {
		issues.push({
			file: fileName,
			level: "error",
			message: "heading が存在しないか空文字です",
		});
	}

	if (typeof obj.description !== "string" || obj.description.length === 0) {
		issues.push({
			file: fileName,
			level: "error",
			message: "description が存在しないか空文字です",
		});
	}

	if (!Array.isArray(obj.body)) {
		issues.push({
			file: fileName,
			level: "error",
			message: "body が配列ではありません",
		});
		return issues;
	}

	for (let i = 0; i < obj.body.length; i++) {
		const item = obj.body[i] as Record<string, unknown>;

		if (typeof item.title !== "string" || item.title.length === 0) {
			issues.push({
				file: fileName,
				level: "error",
				message: `body[${i}]: title が存在しないか空文字です`,
			});
		}

		if (typeof item.url !== "string" || item.url.length === 0) {
			issues.push({
				file: fileName,
				level: "error",
				message: `body[${i}]: url が存在しないか空文字です`,
			});
		}
	}

	return issues;
}

function checkDescriptionFixme(
	fileName: string,
	data: ArticlesJson,
): ValidationIssue[] {
	if (data.description === "FIXME") {
		return [
			{
				file: fileName,
				level: "warning",
				message: `description が "FIXME" です（heading: "${data.heading}"）`,
			},
		];
	}
	return [];
}

function displayResults(issues: ValidationIssue[]): void {
	const errors = issues.filter((i) => i.level === "error");
	const warnings = issues.filter((i) => i.level === "warning");

	console.log("\n=== JSON Article 検証結果 ===");
	console.log(`エラー: ${errors.length} 件, 警告: ${warnings.length} 件\n`);

	if (issues.length === 0) {
		console.log("✅ 問題は見つかりませんでした！");
		return;
	}

	// ファイル別にグループ化
	const byFile = new Map<string, ValidationIssue[]>();
	for (const issue of issues) {
		const existing = byFile.get(issue.file) ?? [];
		existing.push(issue);
		byFile.set(issue.file, existing);
	}

	for (const [file, fileIssues] of byFile.entries()) {
		console.log(`📄 ${file}`);
		for (const issue of fileIssues) {
			const icon = issue.level === "error" ? "❌" : "⚠️";
			console.log(`  ${icon} ${issue.message}`);
		}
		console.log("");
	}
}

async function main(): Promise<void> {
	const contentsPath = process.env.S_CONTENTS_PATH ?? process.cwd();
	const articleDirectory = join(contentsPath, "json", "article");

	console.log("json/article ディレクトリのJSONファイルを検証中...\n");

	const jsonFiles = fs
		.readdirSync(articleDirectory)
		.filter((file) => file.endsWith(".json") && file !== ".DS_Store");

	console.log(`検証対象ファイル数: ${jsonFiles.length}\n`);

	const allIssues: ValidationIssue[] = [];
	let totalArticles = 0;

	for (const fileName of jsonFiles) {
		const filePath = join(articleDirectory, fileName);

		try {
			const content = fs.readFileSync(filePath, "utf8");
			const data: unknown = JSON.parse(content);

			allIssues.push(...validateSchema(fileName, data));

			if (
				typeof data === "object" &&
				data !== null &&
				!Array.isArray(data) &&
				Array.isArray((data as ArticlesJson).body)
			) {
				const articlesJson = data as ArticlesJson;
				totalArticles += articlesJson.body.length;
				allIssues.push(...checkDescriptionFixme(fileName, articlesJson));

				console.log(
					`処理中: ${fileName} (${articlesJson.heading}, ${articlesJson.body.length} 件)`,
				);
			}
		} catch (error) {
			if (error instanceof SyntaxError) {
				allIssues.push({
					file: fileName,
					level: "error",
					message: `JSON解析エラー: ${error.message}`,
				});
			} else {
				allIssues.push({
					file: fileName,
					level: "error",
					message: `ファイル読み込みエラー: ${error}`,
				});
			}
		}
	}

	console.log(`\n合計記事数: ${totalArticles}`);

	displayResults(allIssues);

	const errorCount = allIssues.filter((i) => i.level === "error").length;
	if (errorCount > 0) {
		process.exit(1);
	}
}

main().catch((error) => {
	console.error("❌ エラーが発生しました:", error);
	process.exit(1);
});

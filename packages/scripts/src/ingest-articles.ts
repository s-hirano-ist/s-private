#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import {
	makeExportedStatus,
	makeId,
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPushoverService } from "@s-hirano-ist/s-notification";
import { glob } from "glob";

const SCRIPT_NAME = "ingest-articles";

type ArticleJson = {
	heading: string;
	body: {
		title: string;
		url: string;
		quote?: string;
		ogImageUrl?: string;
		ogTitle?: string;
		ogDescription?: string;
	}[];
};

async function main() {
	const dryRun = process.argv.includes("--dry-run");

	const env = {
		DATABASE_URL: process.env.DATABASE_URL,
		PUSHOVER_URL: process.env.PUSHOVER_URL,
		PUSHOVER_USER_KEY: process.env.PUSHOVER_USER_KEY,
		PUSHOVER_APP_TOKEN: process.env.PUSHOVER_APP_TOKEN,
		USERNAME_TO_EXPORT: process.env.USERNAME_TO_EXPORT,
	} as const;

	if (Object.values(env).some((v) => !v)) {
		throw new Error("Required environment variables are not set.");
	}

	const contentsPath = process.env.S_CONTENTS_PATH ?? process.cwd();

	// Dynamic import for Prisma ESM compatibility
	const { PrismaClient } = await import("@s-hirano-ist/s-database/generated");
	const prisma = new PrismaClient({ accelerateUrl: env.DATABASE_URL ?? "" });

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");
	const exported = makeExportedStatus();

	async function ingestArticles() {
		const files = await glob(`${contentsPath}/json/article/*.json`);
		console.log(`📁 ${files.length} 件のJSONファイルを検出しました。`);

		const existingArticles = await prisma.article.findMany({
			where: { userId },
			select: { url: true },
		});
		const existingUrls = new Set(
			existingArticles.map((a: { url: string }) => a.url),
		);
		console.log(`📊 DB に ${existingUrls.size} 件の既存記事があります。`);

		const existingCategories = await prisma.category.findMany({
			where: { userId },
		});
		const categoryMap = new Map<string, string>(
			existingCategories.map(
				(c: { name: string; id: string }) => [c.name, c.id] as const,
			),
		);

		let insertedCount = 0;
		let skippedCount = 0;
		let errorCount = 0;
		let categoryCreatedCount = 0;

		for (const filePath of files) {
			try {
				const content = await readFile(filePath, "utf-8");
				const json = JSON.parse(content) as ArticleJson;

				const categoryName = json.heading;
				let categoryId = categoryMap.get(categoryName);

				if (!categoryId) {
					if (dryRun) {
						console.log(`🔍 [dry-run] カテゴリ作成予定: ${categoryName}`);
						categoryId = `dry-run-${categoryName}`;
					} else {
						const category = await prisma.category.create({
							data: {
								id: String(makeId()),
								name: categoryName,
								userId,
								createdAt: new Date(),
							},
						});
						categoryId = category.id;
						console.log(`📂 カテゴリ作成: ${categoryName}`);
					}
					categoryMap.set(categoryName, categoryId);
					categoryCreatedCount++;
				}

				for (const item of json.body) {
					if (existingUrls.has(item.url)) {
						skippedCount++;
						continue;
					}

					if (dryRun) {
						console.log(`🔍 [dry-run] 挿入予定: ${item.title} (${item.url})`);
						insertedCount++;
						existingUrls.add(item.url);
						continue;
					}

					await prisma.article.create({
						data: {
							id: String(makeId()),
							title: item.title,
							url: item.url,
							quote: item.quote ?? null,
							ogImageUrl: item.ogImageUrl ?? null,
							ogTitle: item.ogTitle ?? null,
							ogDescription: item.ogDescription ?? null,
							categoryId,
							status: exported.status,
							exportedAt: exported.exportedAt,
							userId,
							createdAt: new Date(),
						},
					});
					insertedCount++;
					existingUrls.add(item.url);
					console.log(`✅ 挿入: ${item.title}`);
				}
			} catch (error) {
				console.error(`❌ エラー（${basename(filePath)}）:`, error);
				errorCount++;
			}
		}

		console.log(
			`\n📊 結果: 挿入 ${insertedCount} 件, スキップ ${skippedCount} 件, エラー ${errorCount} 件, カテゴリ新規 ${categoryCreatedCount} 件${dryRun ? " (dry-run)" : ""}`,
		);
	}

	try {
		await ingestArticles();
		await notificationService.notifyInfo(`${SCRIPT_NAME} completed`, {
			caller: SCRIPT_NAME,
		});
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService.notifyError(`${SCRIPT_NAME} failed: ${error}`, {
			caller: SCRIPT_NAME,
		});
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

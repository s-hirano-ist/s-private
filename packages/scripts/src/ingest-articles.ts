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

	const fileUrls = new Set<string>();

	async function ingestArticles() {
		const files = await glob(`${contentsPath}/json/article/*.json`);
		console.log(`📁 ${files.length} 件のJSONファイルを検出しました。`);

		type ExistingArticle = {
			id: string;
			url: string;
			title: string;
			quote: string | null;
			ogImageUrl: string | null;
			ogTitle: string | null;
			ogDescription: string | null;
		};
		const existingArticles = await prisma.article.findMany({
			where: { userId },
			select: {
				id: true,
				url: true,
				title: true,
				quote: true,
				ogImageUrl: true,
				ogTitle: true,
				ogDescription: true,
			},
		});
		const existingArticlesMap = new Map(
			existingArticles.map((a: ExistingArticle) => [a.url, a]),
		);
		console.log(
			`📊 DB に ${existingArticlesMap.size} 件の既存記事があります。`,
		);

		const existingCategories = await prisma.category.findMany({
			where: { userId },
		});
		const categoryMap = new Map<string, string>(
			existingCategories.map(
				(c: { name: string; id: string }) => [c.name, c.id] as const,
			),
		);

		let insertedCount = 0;
		let updatedCount = 0;
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
					try {
						fileUrls.add(item.url);

						const existing = existingArticlesMap.get(item.url);
						if (existing) {
							const fileQuote = item.quote ?? null;
							const fileOgImageUrl = item.ogImageUrl ?? null;
							const fileOgTitle = item.ogTitle ?? null;
							const fileOgDescription = item.ogDescription ?? null;

							if (
								existing.title === item.title &&
								existing.quote === fileQuote &&
								existing.ogImageUrl === fileOgImageUrl &&
								existing.ogTitle === fileOgTitle &&
								existing.ogDescription === fileOgDescription
							) {
								// console.log(
								// 	`⏭️  スキップ（変更なし）: ${item.title} (${item.url})`,
								// );
								skippedCount++;
								continue;
							}

							if (dryRun) {
								console.log(
									`🔄 [dry-run] 更新予定: ${item.title} (${item.url})`,
								);
							} else {
								await prisma.article.update({
									where: { id: existing.id },
									data: {
										title: item.title,
										quote: fileQuote,
										ogImageUrl: fileOgImageUrl,
										ogTitle: fileOgTitle,
										ogDescription: fileOgDescription,
									},
								});
								console.log(`🔄 更新: ${item.title}`);
							}
							updatedCount++;
							continue;
						}

						if (dryRun) {
							console.log(`🔍 [dry-run] 挿入予定: ${item.title} (${item.url})`);
							insertedCount++;
							existingArticlesMap.set(item.url, {
								id: "",
								url: item.url,
								title: item.title,
								quote: item.quote ?? null,
								ogImageUrl: item.ogImageUrl ?? null,
								ogTitle: item.ogTitle ?? null,
								ogDescription: item.ogDescription ?? null,
							});
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
						existingArticlesMap.set(item.url, {
							id: "",
							url: item.url,
							title: item.title,
							quote: item.quote ?? null,
							ogImageUrl: item.ogImageUrl ?? null,
							ogTitle: item.ogTitle ?? null,
							ogDescription: item.ogDescription ?? null,
						});
						console.log(`✅ 挿入: ${item.title}`);
					} catch (itemError) {
						console.error(
							`❌ エラー（${basename(filePath)} > ${item.title}）:`,
							`url(${item.url.length}文字)=${item.url}`,
							`title(${item.title.length}文字)`,
							`quote(${(item.quote ?? "").length}文字)`,
							`ogImageUrl(${(item.ogImageUrl ?? "").length}文字)`,
							`ogTitle(${(item.ogTitle ?? "").length}文字)`,
							`ogDescription(${(item.ogDescription ?? "").length}文字)`,
							itemError,
						);
						errorCount++;
					}
				}
			} catch (error) {
				console.error(`❌ エラー（${basename(filePath)}）:`, error);
				errorCount++;
			}
		}

		return {
			insertedCount,
			updatedCount,
			skippedCount,
			errorCount,
			categoryCreatedCount,
		};
	}

	async function purgeArticles(): Promise<number> {
		const exportedArticles = await prisma.article.findMany({
			where: { userId, status: exported.status },
			select: { id: true, url: true },
		});

		const toDelete = exportedArticles.filter(
			(a: { id: string; url: string }) => !fileUrls.has(a.url),
		);

		if (toDelete.length === 0) {
			console.log("🗑️  削除対象なし");
			return 0;
		}

		let deletedCount = 0;
		for (const article of toDelete) {
			if (dryRun) {
				console.log(`🗑️  [dry-run] 削除予定: ${article.url}`);
			} else {
				await prisma.article.delete({ where: { id: article.id } });
				console.log(`🗑️  削除: ${article.url}`);
			}
			deletedCount++;
		}

		return deletedCount;
	}

	try {
		const {
			insertedCount,
			updatedCount,
			skippedCount,
			errorCount,
			categoryCreatedCount,
		} = await ingestArticles();
		const deletedCount = await purgeArticles();
		console.log(
			`\n📊 結果: 挿入 ${insertedCount} 件, 更新 ${updatedCount} 件, スキップ ${skippedCount} 件, 削除 ${deletedCount} 件, エラー ${errorCount} 件, カテゴリ新規 ${categoryCreatedCount} 件${dryRun ? " (dry-run)" : ""}`,
		);
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

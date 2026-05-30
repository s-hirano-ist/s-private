#!/usr/bin/env node
import {
	makeExportedStatus,
	makeId,
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPushoverService } from "@s-hirano-ist/s-notification";
import { glob } from "glob";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

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

type ExistingArticle = {
	id: string;
	url: string;
	title: string;
	quote: string | null;
	ogImageUrl: string | null;
	ogTitle: string | null;
	ogDescription: string | null;
};

type ItemOutcome = "inserted" | "updated" | "skipped";

function isUnchanged(
	existing: ExistingArticle,
	item: ArticleJson["body"][number],
	fileQuote: string | null,
	fileOgImageUrl: string | null,
	fileOgTitle: string | null,
	fileOgDescription: string | null,
): boolean {
	return (
		existing.title === item.title &&
		existing.quote === fileQuote &&
		existing.ogImageUrl === fileOgImageUrl &&
		existing.ogTitle === fileOgTitle &&
		existing.ogDescription === fileOgDescription
	);
}

function outcomeKey(
	outcome: ItemOutcome,
): "insertedCount" | "updatedCount" | "skippedCount" {
	if (outcome === "inserted") return "insertedCount";
	if (outcome === "updated") return "updatedCount";
	return "skippedCount";
}

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
	const { createPrismaClient } = await import("@s-hirano-ist/s-database");
	const prisma = createPrismaClient(env.DATABASE_URL ?? "");

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");
	const exported = makeExportedStatus();

	const fileUrls = new Set<string>();

	async function processExisting(
		existing: ExistingArticle,
		item: ArticleJson["body"][number],
	): Promise<ItemOutcome> {
		const fileQuote = item.quote ?? null;
		const fileOgImageUrl = item.ogImageUrl ?? null;
		const fileOgTitle = item.ogTitle ?? null;
		const fileOgDescription = item.ogDescription ?? null;

		if (
			isUnchanged(
				existing,
				item,
				fileQuote,
				fileOgImageUrl,
				fileOgTitle,
				fileOgDescription,
			)
		) {
			// console.log(
			// 	`⏭️  スキップ（変更なし）: ${item.title} (${item.url})`,
			// );
			return "skipped";
		}

		if (dryRun) {
			console.log(`🔄 [dry-run] 更新予定: ${item.title} (${item.url})`);
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
		return "updated";
	}

	async function processNew(
		item: ArticleJson["body"][number],
		categoryId: string,
		existingArticlesMap: Map<string, ExistingArticle>,
	): Promise<ItemOutcome> {
		if (dryRun) {
			console.log(`🔍 [dry-run] 挿入予定: ${item.title} (${item.url})`);
			existingArticlesMap.set(item.url, {
				id: "",
				url: item.url,
				title: item.title,
				quote: item.quote ?? null,
				ogImageUrl: item.ogImageUrl ?? null,
				ogTitle: item.ogTitle ?? null,
				ogDescription: item.ogDescription ?? null,
			});
			return "inserted";
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
		return "inserted";
	}

	async function processItem(
		item: ArticleJson["body"][number],
		categoryId: string,
		existingArticlesMap: Map<string, ExistingArticle>,
	): Promise<ItemOutcome> {
		fileUrls.add(item.url);

		const existing = existingArticlesMap.get(item.url);
		if (existing) {
			return processExisting(existing, item);
		}

		return processNew(item, categoryId, existingArticlesMap);
	}

	async function resolveCategoryId(
		categoryName: string,
		categoryMap: Map<string, string>,
	): Promise<{ categoryId: string; created: boolean }> {
		const existingId = categoryMap.get(categoryName);
		if (existingId) {
			return { categoryId: existingId, created: false };
		}

		let categoryId: string;
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
		return { categoryId, created: true };
	}

	async function ingestArticles() {
		const files = await glob(`${contentsPath}/json/article/*.json`);
		console.log(`📁 ${files.length} 件のJSONファイルを検出しました。`);

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

		const counts = { insertedCount: 0, updatedCount: 0, skippedCount: 0 };
		let errorCount = 0;
		let categoryCreatedCount = 0;

		for (const filePath of files) {
			try {
				const content = await readFile(filePath, "utf-8");
				const json = JSON.parse(content) as ArticleJson;

				const categoryName = json.heading;
				const { categoryId, created } = await resolveCategoryId(
					categoryName,
					categoryMap,
				);
				if (created) {
					categoryCreatedCount++;
				}

				for (const item of json.body) {
					try {
						const outcome = await processItem(
							item,
							categoryId,
							existingArticlesMap,
						);
						counts[outcomeKey(outcome)]++;
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
			insertedCount: counts.insertedCount,
			updatedCount: counts.updatedCount,
			skippedCount: counts.skippedCount,
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
		await notificationService.notifyError(
			`${SCRIPT_NAME} failed: ${String(error)}`,
			{
				caller: SCRIPT_NAME,
			},
		);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});

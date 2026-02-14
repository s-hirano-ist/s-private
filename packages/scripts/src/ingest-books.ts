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

const SCRIPT_NAME = "ingest-books";

function parseBookFile(content: string): {
	title: string;
	markdown: string | null;
} {
	const lines = content.split("\n");
	let title = "";
	let bodyStartIndex = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line?.startsWith("# ")) {
			title = line.slice(2).trim();
			bodyStartIndex = i + 1;
			break;
		}
	}

	const body = lines.slice(bodyStartIndex).join("\n").trim();
	return { title, markdown: body || null };
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
	const { PrismaClient } = await import("@s-hirano-ist/s-database/generated");
	const prisma = new PrismaClient({ accelerateUrl: env.DATABASE_URL ?? "" });

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");
	const exported = makeExportedStatus();

	const fileIsbns = new Set<string>();

	async function ingestBooks() {
		const files = await glob(`${contentsPath}/markdown/book/*.md`);
		console.log(`📁 ${files.length} 件のファイルを検出しました。`);

		const existingBooks = await prisma.book.findMany({
			where: { userId },
			select: { id: true, isbn: true, title: true, markdown: true },
		});
		const existingBooksMap = new Map(
			existingBooks.map(
				(b: {
					id: string;
					isbn: string;
					title: string;
					markdown: string | null;
				}) => [b.isbn, b],
			),
		);
		console.log(`📊 DB に ${existingBooksMap.size} 件の既存書籍があります。`);

		let insertedCount = 0;
		let updatedCount = 0;
		let skippedCount = 0;
		let errorCount = 0;

		for (const filePath of files) {
			const isbn = basename(filePath, ".md");
			let title = "";
			let markdown: string | null = null;
			try {
				fileIsbns.add(isbn);

				const content = await readFile(filePath, "utf-8");
				({ title, markdown } = parseBookFile(content));

				if (!title) {
					console.error(`⚠️  タイトルなし: ${basename(filePath)}`);
					errorCount++;
					continue;
				}

				const existing = existingBooksMap.get(isbn);
				if (existing) {
					if (existing.title === title && existing.markdown === markdown) {
						// console.log(`⏭️  スキップ（変更なし）: ${isbn} (${existing.title})`);
						skippedCount++;
						continue;
					}
					if (dryRun) {
						console.log(`🔄 [dry-run] 更新予定: ${isbn} (${title})`);
					} else {
						await prisma.book.update({
							where: { id: existing.id },
							data: { title, markdown },
						});
						console.log(`🔄 更新: ${isbn} (${title})`);
					}
					updatedCount++;
					continue;
				}

				if (dryRun) {
					console.log(`🔍 [dry-run] 挿入予定: ${isbn} (${title})`);
					insertedCount++;
					continue;
				}

				await prisma.book.create({
					data: {
						id: String(makeId()),
						isbn,
						title,
						markdown,
						status: exported.status,
						exportedAt: exported.exportedAt,
						userId,
						createdAt: new Date(),
						tags: [],
					},
				});
				insertedCount++;
				console.log(`✅ 挿入: ${isbn} (${title})`);
			} catch (error) {
				console.error(
					`❌ エラー（${basename(filePath)}）:`,
					`isbn=${isbn}`,
					`title(${title.length}文字)`,
					`markdown(${(markdown ?? "").length}文字)`,
					error,
				);
				errorCount++;
			}
		}

		return { insertedCount, updatedCount, skippedCount, errorCount };
	}

	async function purgeBooks(): Promise<number> {
		const exportedBooks = await prisma.book.findMany({
			where: { userId, status: exported.status },
			select: { id: true, isbn: true },
		});

		const toDelete = exportedBooks.filter(
			(b: { id: string; isbn: string }) => !fileIsbns.has(b.isbn),
		);

		if (toDelete.length === 0) {
			console.log("🗑️  削除対象なし");
			return 0;
		}

		let deletedCount = 0;
		for (const book of toDelete) {
			if (dryRun) {
				console.log(`🗑️  [dry-run] 削除予定: ${book.isbn}`);
			} else {
				await prisma.book.delete({ where: { id: book.id } });
				console.log(`🗑️  削除: ${book.isbn}`);
			}
			deletedCount++;
		}

		return deletedCount;
	}

	try {
		const { insertedCount, updatedCount, skippedCount, errorCount } =
			await ingestBooks();
		const deletedCount = await purgeBooks();
		console.log(
			`\n📊 結果: 挿入 ${insertedCount} 件, 更新 ${updatedCount} 件, スキップ ${skippedCount} 件, 削除 ${deletedCount} 件, エラー ${errorCount} 件${dryRun ? " (dry-run)" : ""}`,
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

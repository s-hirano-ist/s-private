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

	async function ingestBooks() {
		const files = await glob(`${contentsPath}/markdown/book/*.md`);
		console.log(`📁 ${files.length} 件のファイルを検出しました。`);

		const existingBooks = await prisma.book.findMany({
			where: { userId },
			select: { isbn: true },
		});
		const existingIsbns = new Set(
			existingBooks.map((b: { isbn: string }) => b.isbn),
		);
		console.log(`📊 DB に ${existingIsbns.size} 件の既存書籍があります。`);

		let insertedCount = 0;
		let skippedCount = 0;
		let errorCount = 0;

		for (const filePath of files) {
			try {
				const isbn = basename(filePath, ".md");

				if (existingIsbns.has(isbn)) {
					skippedCount++;
					continue;
				}

				const content = await readFile(filePath, "utf-8");
				const { title, markdown } = parseBookFile(content);

				if (!title) {
					console.error(`⚠️  タイトルなし: ${basename(filePath)}`);
					errorCount++;
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
				console.error(`❌ エラー（${basename(filePath)}）:`, error);
				errorCount++;
			}
		}

		console.log(
			`\n📊 結果: 挿入 ${insertedCount} 件, スキップ ${skippedCount} 件, エラー ${errorCount} 件${dryRun ? " (dry-run)" : ""}`,
		);
	}

	try {
		await ingestBooks();
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

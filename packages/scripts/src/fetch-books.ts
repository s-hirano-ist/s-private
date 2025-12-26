#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
	makeUnexportedStatus,
	makeUserId,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/common";
import { createPushoverService } from "@s-hirano-ist/s-notification";

type Book = {
	id: string;
	ISBN: string;
	title: string;
};

const OUTPUT_DIR = "markdown/books/";

async function main() {
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

	// Dynamic import for Prisma ESM compatibility
	// @ts-expect-error - Prisma ESM export compatibility
	const { PrismaClient } = await import("@prisma/client");
	const prisma = new (PrismaClient as any)({
		accelerateUrl: env.DATABASE_URL ?? "",
	});

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");
	const UNEXPORTED: Status = makeUnexportedStatus();

	async function exportData(data: Book[]) {
		for (const item of data) {
			const filePath = `${OUTPUT_DIR}${item.ISBN}.md`;
			await mkdir(dirname(filePath), { recursive: true });
			await writeFile(filePath, `# ${item.title}\n`);
		}
	}

	async function fetchBooks() {
		const books = await prisma.book.findMany({
			where: { userId, status: UNEXPORTED },
		});
		console.log(`📊 ${books.length} 件のデータを取得しました。`);

		await exportData(books);
		console.log("💾 データがMarkdownファイルに書き出されました。");
	}

	try {
		await fetchBooks();
		await notificationService.notifyInfo("fetch-books completed", {
			caller: "fetch-books",
		});
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService.notifyError(`fetch-books failed: ${error}`, {
			caller: "fetch-books",
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

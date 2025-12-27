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

type Note = {
	id: string;
	title: string;
	markdown: string;
};

const OUTPUT_DIR = "markdown/note/";

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
	const { PrismaClient } = await import("@s-hirano-ist/s-database/generated");
	const prisma = new PrismaClient({
		accelerateUrl: env.DATABASE_URL ?? "",
	});

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");
	const UNEXPORTED: Status = makeUnexportedStatus();

	async function exportData(data: Note[]) {
		for (const item of data) {
			const filePath = `${OUTPUT_DIR}${item.title}.md`;
			await mkdir(dirname(filePath), { recursive: true });
			await writeFile(filePath, `# ${item.title}\n\n${item.markdown}\n`);
		}
	}

	async function fetchNotes() {
		const notes = await prisma.note.findMany({
			where: { userId, status: UNEXPORTED },
			select: { id: true, title: true, markdown: true },
		});
		console.log(`📊 ${notes.length} 件のデータを取得しました。`);

		await exportData(notes);
		console.log("💾 データがMarkdownファイルに書き出されました。");
	}

	try {
		await fetchNotes();
		await notificationService.notifyInfo("fetch-notes completed", {
			caller: "fetch-notes",
		});
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService.notifyError(`fetch-notes failed: ${error}`, {
			caller: "fetch-notes",
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

#!/usr/bin/env node
import {
	makeUnexportedStatus,
	makeUserId,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { runCli, cliNotifications } from "./lib/cli-observability.js";

type Note = {
	id: string;
	markdown: string;
	title: string;
};

const OUTPUT_DIR = "markdown/note/";

async function exportData(data: Note[]) {
	for (const item of data) {
		const filePath = `${OUTPUT_DIR}${item.title}.md`;
		await mkdir(dirname(filePath), { recursive: true });
		await writeFile(filePath, `# ${item.title}\n\n${item.markdown}\n`);
	}
}

async function main() {
	const env = {
		DATABASE_URL: process.env.DATABASE_URL,
		USERNAME_TO_EXPORT: process.env.USERNAME_TO_EXPORT,
	} as const;

	if (Object.values(env).some((v) => !v)) {
		throw new Error("Required environment variables are not set.");
	}

	const prisma = createPrismaClient(env.DATABASE_URL ?? "");

	const notificationService = cliNotifications;

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");
	const UNEXPORTED: Status = makeUnexportedStatus();

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
	} finally {
		await prisma.$disconnect();
	}
}

await runCli("fetch-notes", main);

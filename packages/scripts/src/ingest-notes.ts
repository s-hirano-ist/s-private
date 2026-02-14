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

const SCRIPT_NAME = "ingest-notes";

function parseFrontmatter(content: string): {
	heading?: string;
	draft?: boolean;
	body: string;
} {
	if (!content.startsWith("---")) {
		return { body: content };
	}
	const endIndex = content.indexOf("---", 3);
	if (endIndex === -1) {
		return { body: content };
	}
	const frontmatter = content.slice(3, endIndex).trim();
	const body = content.slice(endIndex + 3).trim();

	let heading: string | undefined;
	let draft = false;
	for (const line of frontmatter.split("\n")) {
		const [key, ...rest] = line.split(":");
		const value = rest.join(":").trim();
		if (key?.trim() === "heading") heading = value;
		if (key?.trim() === "draft" && value === "true") draft = true;
	}
	return { heading, draft, body };
}

function parseNoteFile(
	filePath: string,
	content: string,
): { title: string; markdown: string } | null {
	const { heading, draft, body } = parseFrontmatter(content);

	if (draft) return null;

	if (heading) {
		return { title: heading, markdown: body };
	}

	const title = basename(filePath, ".md");
	const titleLine = `# ${title}`;
	let markdown = body;
	if (markdown.startsWith(titleLine)) {
		markdown = markdown.slice(titleLine.length).replace(/^\n+/, "");
	}
	return { title, markdown };
}

async function main() {
	const dryRun = process.argv.includes("--dry-run");
	const purge = process.argv.includes("--purge");

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

	const fileTitles = new Set<string>();

	async function ingestNotes() {
		const files = await glob(`${contentsPath}/markdown/note/*.md`);
		console.log(`📁 ${files.length} 件のファイルを検出しました。`);

		const existingNotes = await prisma.note.findMany({
			where: { userId },
			select: { id: true, title: true, markdown: true },
		});
		const existingNotesMap = new Map(
			existingNotes.map(
				(n: { id: string; title: string; markdown: string }) => [n.title, n],
			),
		);
		console.log(`📊 DB に ${existingNotesMap.size} 件の既存ノートがあります。`);

		let insertedCount = 0;
		let updatedCount = 0;
		let skippedCount = 0;
		let errorCount = 0;

		for (const filePath of files) {
			try {
				const content = await readFile(filePath, "utf-8");
				const parsed = parseNoteFile(filePath, content);

				if (!parsed) {
					console.log(`⏭️  スキップ（draft）: ${basename(filePath)}`);
					skippedCount++;
					continue;
				}

				fileTitles.add(parsed.title);

				const existing = existingNotesMap.get(parsed.title);
				if (existing) {
					if (existing.markdown === parsed.markdown) {
						skippedCount++;
						continue;
					}
					if (dryRun) {
						console.log(`🔄 [dry-run] 更新予定: ${parsed.title}`);
					} else {
						await prisma.note.update({
							where: { id: existing.id },
							data: { markdown: parsed.markdown },
						});
						console.log(`🔄 更新: ${parsed.title}`);
					}
					updatedCount++;
					continue;
				}

				if (dryRun) {
					console.log(`🔍 [dry-run] 挿入予定: ${parsed.title}`);
					insertedCount++;
					continue;
				}

				await prisma.note.create({
					data: {
						id: String(makeId()),
						title: parsed.title,
						markdown: parsed.markdown,
						status: exported.status,
						exportedAt: exported.exportedAt,
						userId,
						createdAt: new Date(),
					},
				});
				insertedCount++;
				console.log(`✅ 挿入: ${parsed.title}`);
			} catch (error) {
				console.error(`❌ エラー（${basename(filePath)}）:`, error);
				errorCount++;
			}
		}

		console.log(
			`\n📊 結果: 挿入 ${insertedCount} 件, 更新 ${updatedCount} 件, スキップ ${skippedCount} 件, エラー ${errorCount} 件${dryRun ? " (dry-run)" : ""}`,
		);
	}

	async function purgeNotes() {
		const exportedNotes = await prisma.note.findMany({
			where: { userId, status: exported.status },
			select: { id: true, title: true },
		});

		const toDelete = exportedNotes.filter(
			(n: { id: string; title: string }) => !fileTitles.has(n.title),
		);

		if (toDelete.length === 0) {
			console.log("\n🗑️  削除対象なし");
			return;
		}

		let deletedCount = 0;
		for (const note of toDelete) {
			if (dryRun) {
				console.log(`🗑️  [dry-run] 削除予定: ${note.title}`);
			} else {
				await prisma.note.delete({ where: { id: note.id } });
				console.log(`🗑️  削除: ${note.title}`);
			}
			deletedCount++;
		}

		console.log(
			`\n📊 Purge結果: 削除 ${deletedCount} 件${dryRun ? " (dry-run)" : ""}`,
		);
	}

	try {
		await ingestNotes();
		if (purge) await purgeNotes();
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

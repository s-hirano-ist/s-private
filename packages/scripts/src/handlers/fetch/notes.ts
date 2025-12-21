import { writeFile } from "node:fs/promises";
import { makeUnexportedStatus, makeUserId } from "@s-hirano-ist/s-core/common";
import type { PrismaClient } from "@s-hirano-ist/s-database/generated";
import type { BaseEnv } from "../shared/env.js";

type Note = {
	id: string;
	title: string;
	markdown: string;
};

const OUTPUT_DIR = "markdown/note/";

async function exportData(data: Note[]): Promise<void> {
	for (const item of data) {
		const filePath = `${OUTPUT_DIR}${item.title}.md`;
		await writeFile(filePath, `#${item.title}\n\n${item.markdown}\n`);
	}
}

export async function fetchNotes(
	prisma: PrismaClient,
	env: BaseEnv,
): Promise<void> {
	const userId = makeUserId(env.USERNAME_TO_EXPORT);
	const UNEXPORTED = makeUnexportedStatus();

	const notes = await prisma.note.findMany({
		where: { userId, status: UNEXPORTED },
		select: { id: true, title: true, markdown: true },
	});
	console.log("Data fetched.");

	await exportData(notes);
	console.log("Data exported to Markdown files.");
}

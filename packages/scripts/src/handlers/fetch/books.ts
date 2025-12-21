import { writeFile } from "node:fs/promises";
import { makeUnexportedStatus, makeUserId } from "@s-hirano-ist/s-core/common";
import type { PrismaClient } from "@s-hirano-ist/s-database";
import type { BaseEnv } from "../shared/env.js";

type Book = {
	id: string;
	ISBN: string;
	title: string;
};

const OUTPUT_DIR = "markdown/books/";

async function exportData(data: Book[]): Promise<void> {
	for (const item of data) {
		const filePath = `${OUTPUT_DIR}${item.ISBN}.md`;
		await writeFile(filePath, `#${item.title}\n`);
	}
}

export async function fetchBooks(
	prisma: PrismaClient,
	env: BaseEnv,
): Promise<void> {
	const userId = makeUserId(env.USERNAME_TO_EXPORT);
	const UNEXPORTED = makeUnexportedStatus();

	const books = await prisma.book.findMany({
		where: { userId, status: UNEXPORTED },
	});
	console.log("Data fetched.");

	await exportData(books);
	console.log("Data exported to Markdown files.");
}

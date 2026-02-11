#!/usr/bin/env node
import "dotenv/config";
import { parseDbArticle, parseDbNote } from "@s-hirano-ist/s-search/chunker";
import type { QdrantPayload } from "@s-hirano-ist/s-search/config";
import { ingestChunks } from "@s-hirano-ist/s-search/ingest";
import {
	ensureCollection,
	getCollectionStats,
} from "@s-hirano-ist/s-search/qdrant-client";

/**
 * CLI entry point: fetch EXPORTED content from PostgreSQL and ingest into Qdrant
 */
async function ingestDb(): Promise<void> {
	const env = {
		DATABASE_URL: process.env.DATABASE_URL,
		QDRANT_URL: process.env.QDRANT_URL,
		USERNAME_TO_EXPORT: process.env.USERNAME_TO_EXPORT,
	} as const;

	if (!env.DATABASE_URL || !env.QDRANT_URL || !env.USERNAME_TO_EXPORT) {
		throw new Error(
			"DATABASE_URL, QDRANT_URL, and USERNAME_TO_EXPORT environment variables are required.",
		);
	}

	// Dynamic import for Prisma ESM compatibility
	const { PrismaClient } = await import("@s-hirano-ist/s-database/generated");
	const prisma = new PrismaClient({
		accelerateUrl: env.DATABASE_URL,
	});

	try {
		// Ensure Qdrant collection exists
		await ensureCollection();

		const initialStats = await getCollectionStats();
		console.log(`Initial points count: ${initialStats.pointsCount}\n`);

		const allChunks: QdrantPayload[] = [];

		// Fetch EXPORTED notes
		const notes = await prisma.note.findMany({
			where: { userId: env.USERNAME_TO_EXPORT, status: "EXPORTED" },
			select: { id: true, title: true, markdown: true },
		});
		console.log(`Found ${notes.length} EXPORTED notes`);

		for (const note of notes) {
			try {
				const chunks = parseDbNote(note.id, note.title, note.markdown);
				allChunks.push(...chunks);
			} catch (error) {
				console.error(`Error parsing note "${note.title}":`, error);
			}
		}

		// Fetch EXPORTED articles with category
		const articles = await prisma.article.findMany({
			where: { userId: env.USERNAME_TO_EXPORT, status: "EXPORTED" },
			select: {
				id: true,
				title: true,
				url: true,
				ogTitle: true,
				ogDescription: true,
				quote: true,
				Category: { select: { name: true } },
			},
		});
		console.log(`Found ${articles.length} EXPORTED articles`);

		for (const article of articles) {
			try {
				const chunks = parseDbArticle({
					id: article.id,
					title: article.title,
					url: article.url,
					ogTitle: article.ogTitle,
					ogDescription: article.ogDescription,
					quote: article.quote,
					categoryName: article.Category.name,
				});
				allChunks.push(...chunks);
			} catch (error) {
				console.error(`Error parsing article "${article.title}":`, error);
			}
		}

		console.log(`\nTotal chunks from DB: ${allChunks.length}\n`);

		// Delegate to core ingest logic
		const result = await ingestChunks(allChunks);

		// Get final stats
		const finalStats = await getCollectionStats();
		console.log(`\nFinal points count: ${finalStats.pointsCount}`);
		console.log(
			`Ingest completed successfully! (${result.changedChunks} changed, ${result.skippedChunks} skipped)`,
		);
	} finally {
		await prisma.$disconnect();
	}
}

ingestDb().catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});

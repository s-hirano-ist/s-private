#!/usr/bin/env node
import { readFileSync } from "node:fs";
import {
	parseJsonArticle,
	parseMarkdown,
} from "@s-hirano-ist/s-search/chunker";
import type { ContentType, QdrantPayload } from "@s-hirano-ist/s-search/config";
import { ingestChunks, pruneOrphans } from "@s-hirano-ist/s-search/ingest";
import {
	ensureCollection,
	getCollectionStats,
} from "@s-hirano-ist/s-search/qdrant-client";
import { glob } from "glob";
import { INGEST_CONFIG } from "./ingest-config.ts";

type FileInfo = {
	path: string;
	type: "json" | "markdown";
	contentType: ContentType;
};

/**
 * List all files to process with content type information
 */
async function listFiles(): Promise<FileInfo[]> {
	const files: FileInfo[] = [];

	// Articles (JSON)
	const articleFiles = await glob(INGEST_CONFIG.paths.articles);
	for (const path of articleFiles) {
		files.push({ path, type: "json", contentType: "articles" });
	}

	// Notes (Markdown)
	const noteFiles = await glob(INGEST_CONFIG.paths.notes);
	for (const path of noteFiles) {
		files.push({ path, type: "markdown", contentType: "notes" });
	}

	// Books (Markdown)
	const bookFiles = await glob(INGEST_CONFIG.paths.books);
	for (const path of bookFiles) {
		files.push({ path, type: "markdown", contentType: "books" });
	}

	return files;
}

/**
 * Parse a single file into chunks
 */
function parseFile(file: FileInfo): QdrantPayload[] {
	const content = readFileSync(file.path, "utf-8");

	if (file.type === "json") {
		return parseJsonArticle(file.path, content);
	}
	return parseMarkdown(file.path, content, file.contentType);
}

type IngestFlags = {
	force: boolean;
	dryRun: boolean;
};

/**
 * CLI entry point: list files, parse into chunks, delegate to ingestChunks
 */
async function ingest(flags: IngestFlags): Promise<void> {
	console.log("Starting ingest...\n");

	if (!flags.dryRun) {
		await ensureCollection();
		const initialStats = await getCollectionStats();
		console.log(`Initial points count: ${initialStats.pointsCount}\n`);
	} else {
		console.log("Dry-run mode: no writes to Qdrant\n");
	}

	if (flags.force) {
		console.log("Force mode enabled: skipping change detection\n");
	}

	const files = await listFiles();
	const articleCount = files.filter((f) => f.contentType === "articles").length;
	const noteCount = files.filter((f) => f.contentType === "notes").length;
	const bookCount = files.filter((f) => f.contentType === "books").length;

	console.log(`Found ${files.length} files to process`);
	console.log(`  - Articles: ${articleCount}`);
	console.log(`  - Notes: ${noteCount}`);
	console.log(`  - Books: ${bookCount}\n`);

	console.log("Parsing files...");
	const allChunks: QdrantPayload[] = [];

	for (const file of files) {
		try {
			const chunks = parseFile(file);
			allChunks.push(...chunks);
		} catch (error) {
			console.error(`Error parsing ${file.path}:`, error);
		}
	}

	console.log(`Total chunks parsed: ${allChunks.length}`);

	if (flags.dryRun) {
		console.log("Dry-run complete. Skipping upsert and prune.");
		return;
	}

	const result = await ingestChunks(allChunks, { force: flags.force });

	const pruneResult = await pruneOrphans(allChunks.map((c) => c.chunk_id));

	const finalStats = await getCollectionStats();
	console.log(`\nFinal points count: ${finalStats.pointsCount}`);
	console.log(
		`Ingest completed! (${result.changedChunks} changed, ${result.skippedChunks} skipped, ${pruneResult.deletedCount} pruned)`,
	);
}

async function main() {
	if (!process.env.QDRANT_URL) {
		console.error("QDRANT_URL environment variable is required.");
		process.exit(1);
	}

	const flags: IngestFlags = {
		force: process.argv.includes("--force"),
		dryRun: process.argv.includes("--dry-run"),
	};

	try {
		await ingest(flags);
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		process.exit(2);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(2);
});

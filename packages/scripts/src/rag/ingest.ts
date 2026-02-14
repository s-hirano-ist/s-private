#!/usr/bin/env node
import "dotenv/config";
import { readFileSync } from "node:fs";
import {
	parseJsonArticle,
	parseMarkdown,
} from "@s-hirano-ist/s-search/chunker";
import type { ContentType, QdrantPayload } from "@s-hirano-ist/s-search/config";
import { createEmbeddingClient } from "@s-hirano-ist/s-search/embedding-client";
import { ingestChunks } from "@s-hirano-ist/s-search/ingest";
import {
	ensureCollection,
	getCollectionStats,
} from "@s-hirano-ist/s-search/qdrant-client";
import { glob } from "glob";
import { INGEST_CONFIG } from "./ingest-config";

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

/**
 * CLI entry point: list files, parse into chunks, delegate to ingestChunks
 */
async function ingest(force: boolean): Promise<void> {
	console.log("Starting ingest...\n");

	// Ensure collection exists
	await ensureCollection();

	// Get initial stats
	const initialStats = await getCollectionStats();
	console.log(`Initial points count: ${initialStats.pointsCount}\n`);

	if (force) {
		console.log("Force mode enabled: skipping change detection\n");
	}

	// List all files
	const files = await listFiles();
	const articleCount = files.filter((f) => f.contentType === "articles").length;
	const noteCount = files.filter((f) => f.contentType === "notes").length;
	const bookCount = files.filter((f) => f.contentType === "books").length;

	console.log(`Found ${files.length} files to process`);
	console.log(`  - Articles: ${articleCount}`);
	console.log(`  - Notes: ${noteCount}`);
	console.log(`  - Books: ${bookCount}\n`);

	// Parse all files into chunks
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

	// Use VPS embedding if EMBEDDING_API_URL is set, otherwise local
	const embedBatchFn = process.env.EMBEDDING_API_URL
		? createEmbeddingClient({
				apiUrl: process.env.EMBEDDING_API_URL,
				apiKey: process.env.EMBEDDING_API_KEY ?? "",
				cfAccessClientId: process.env.CF_ACCESS_CLIENT_ID ?? "",
				cfAccessClientSecret: process.env.CF_ACCESS_CLIENT_SECRET ?? "",
			}).embedBatch
		: undefined;

	// Delegate to core ingest logic
	const result = await ingestChunks(allChunks, { embedBatchFn, force });

	// Get final stats
	const finalStats = await getCollectionStats();
	console.log(`\nFinal points count: ${finalStats.pointsCount}`);
	console.log(
		`Ingest completed successfully! (${result.changedChunks} changed, ${result.skippedChunks} skipped)`,
	);
}

async function main() {
	const env = {
		QDRANT_URL: process.env.QDRANT_URL,
		CF_ACCESS_CLIENT_ID: process.env.CF_ACCESS_CLIENT_ID,
		CF_ACCESS_CLIENT_SECRET: process.env.CF_ACCESS_CLIENT_SECRET,
	} as const;

	if (!env.QDRANT_URL) {
		throw new Error("QDRANT_URL environment variable is required.");
	}
	if (!env.CF_ACCESS_CLIENT_ID || !env.CF_ACCESS_CLIENT_SECRET) {
		throw new Error(
			"CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET environment variables are required.",
		);
	}

	const force = process.argv.includes("--force");

	try {
		await ingest(force);
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

#!/usr/bin/env node
import "dotenv/config";
import { readFileSync } from "node:fs";
import {
	parseJsonArticle,
	parseMarkdown,
} from "@s-hirano-ist/s-search/chunker";
import type { QdrantPayload } from "@s-hirano-ist/s-search/config";
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
};

/**
 * List all files to process
 */
async function listFiles(): Promise<FileInfo[]> {
	const files: FileInfo[] = [];

	// JSON files
	const jsonFiles = await glob(INGEST_CONFIG.paths.json);
	for (const path of jsonFiles) {
		files.push({ path, type: "json" });
	}

	// Markdown files (supports array of patterns)
	const mdPatterns = Array.isArray(INGEST_CONFIG.paths.markdown)
		? INGEST_CONFIG.paths.markdown
		: [INGEST_CONFIG.paths.markdown];

	for (const pattern of mdPatterns) {
		const mdFiles = await glob(pattern);
		for (const path of mdFiles) {
			files.push({ path, type: "markdown" });
		}
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
	return parseMarkdown(file.path, content);
}

/**
 * CLI entry point: list files, parse into chunks, delegate to ingestChunks
 */
async function ingest(): Promise<void> {
	console.log("Starting ingest...\n");

	// Ensure collection exists
	await ensureCollection();

	// Get initial stats
	const initialStats = await getCollectionStats();
	console.log(`Initial points count: ${initialStats.pointsCount}\n`);

	// List all files
	const files = await listFiles();
	console.log(`Found ${files.length} files to process`);
	console.log(`  - JSON: ${files.filter((f) => f.type === "json").length}`);
	console.log(
		`  - Markdown: ${files.filter((f) => f.type === "markdown").length}\n`,
	);

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
	const result = await ingestChunks(allChunks, { embedBatchFn });

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

	try {
		await ingest();
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

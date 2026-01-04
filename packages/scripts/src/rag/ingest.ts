#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { glob } from "glob";
import { parseJsonArticle, parseMarkdown } from "./chunker.js";
import { type QdrantPayload, RAG_CONFIG } from "./config.js";
import { embedBatch } from "./embedding.js";
import {
	ensureCollection,
	getCollectionStats,
	getExistingHashes,
	upsertPoints,
} from "./qdrant-client.js";

const BATCH_SIZE = 20;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
	fn: () => Promise<T>,
	retries = MAX_RETRIES,
): Promise<T> {
	for (let i = 0; i < retries; i++) {
		try {
			return await fn();
		} catch (error) {
			if (i === retries - 1) throw error;
			console.log(`  Retry ${i + 1}/${retries} after error...`);
			await sleep(RETRY_DELAY_MS);
		}
	}
	throw new Error("Unreachable");
}

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
	const jsonFiles = await glob(RAG_CONFIG.paths.json);
	for (const path of jsonFiles) {
		files.push({ path, type: "json" });
	}

	// Markdown files (supports array of patterns)
	const mdPatterns = Array.isArray(RAG_CONFIG.paths.markdown)
		? RAG_CONFIG.paths.markdown
		: [RAG_CONFIG.paths.markdown];

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
 * Ingest all documents
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

	console.log(`Total chunks: ${allChunks.length}\n`);

	// Get existing hashes for change detection
	console.log("Checking for changes...");
	const chunkIds = allChunks.map((c) => c.chunk_id);
	const existingHashes = await getExistingHashes(chunkIds);

	// Filter to only changed chunks
	const changedChunks = allChunks.filter((chunk) => {
		const existingHash = existingHashes.get(chunk.chunk_id);
		return existingHash !== chunk.content_hash;
	});

	console.log(`Changed chunks: ${changedChunks.length}`);
	console.log(
		`Skipped (unchanged): ${allChunks.length - changedChunks.length}\n`,
	);

	if (changedChunks.length === 0) {
		console.log("No changes detected. Done!");
		return;
	}

	// Generate embeddings and upsert in batches
	console.log("Generating embeddings and upserting...");
	let processed = 0;

	for (let i = 0; i < changedChunks.length; i += BATCH_SIZE) {
		const batch = changedChunks.slice(i, i + BATCH_SIZE);
		const texts = batch.map((c) => c.text);

		// Generate embeddings
		const embeddings = await embedBatch(texts, false);

		// Prepare points
		const points = batch.map((chunk, idx) => ({
			id: chunk.chunk_id,
			vector: embeddings[idx],
			payload: chunk,
		}));

		// Upsert to Qdrant with retry
		await withRetry(() => upsertPoints(points));

		processed += batch.length;
		console.log(`  Progress: ${processed}/${changedChunks.length}`);

		// Small delay between batches to avoid overwhelming Qdrant
		await sleep(100);
	}

	// Get final stats
	const finalStats = await getCollectionStats();
	console.log(`\nFinal points count: ${finalStats.pointsCount}`);
	console.log("Ingest completed successfully!");
}

async function main() {
	const env = {
		QDRANT_URL: process.env.QDRANT_URL,
	} as const;

	if (!env.QDRANT_URL) {
		throw new Error("QDRANT_URL environment variable is required.");
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

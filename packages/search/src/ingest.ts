import type { QdrantPayload } from "./config.ts";
import { getExistingHashes, upsertPoints } from "./qdrant-client.ts";

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

export type IngestResult = {
	totalChunks: number;
	changedChunks: number;
	skippedChunks: number;
};

export type IngestOptions = {
	embedBatchFn: (texts: string[], isQuery?: boolean) => Promise<number[][]>;
	force?: boolean;
};

/**
 * Ingest chunks into Qdrant with change detection, batch embedding, and retry logic.
 * This function does NOT handle file I/O — callers are responsible for parsing files into chunks.
 */
export async function ingestChunks(
	chunks: QdrantPayload[],
	options: IngestOptions,
): Promise<IngestResult> {
	console.log(`Total chunks: ${chunks.length}\n`);

	let changedChunks: QdrantPayload[];
	let skippedChunks: number;

	if (options.force) {
		// Force mode: treat all chunks as changed
		changedChunks = chunks;
		skippedChunks = 0;
	} else {
		// Get existing hashes for change detection
		console.log("Checking for changes...");
		const chunkIds = chunks.map((c) => c.chunk_id);
		const existingHashes = await getExistingHashes(chunkIds);

		// Filter to only changed chunks
		changedChunks = chunks.filter((chunk) => {
			const existingHash = existingHashes.get(chunk.chunk_id);
			return existingHash !== chunk.content_hash;
		});

		skippedChunks = chunks.length - changedChunks.length;
	}
	console.log(`Changed chunks: ${changedChunks.length}`);
	console.log(`Skipped (unchanged): ${skippedChunks}\n`);

	if (changedChunks.length === 0) {
		console.log("No changes detected. Done!");
		return {
			totalChunks: chunks.length,
			changedChunks: 0,
			skippedChunks,
		};
	}

	// Generate embeddings and upsert in batches
	const batchEmbed = options.embedBatchFn;
	console.log("Generating embeddings and upserting...");
	let processed = 0;

	for (let i = 0; i < changedChunks.length; i += BATCH_SIZE) {
		const batch = changedChunks.slice(i, i + BATCH_SIZE);
		const texts = batch.map((c) => c.text);

		// Generate embeddings
		const embeddings = await batchEmbed(texts, false);

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

	return {
		totalChunks: chunks.length,
		changedChunks: changedChunks.length,
		skippedChunks,
	};
}

import type { QdrantPayload } from "./config.ts";
import {
	deletePointsByChunkIds,
	getExistingHashes,
	listAllChunkIds,
	upsertPoints,
} from "./qdrant-client.ts";

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

	// Upsert in batches (Qdrant Inference handles embedding server-side)
	console.log("Upserting to Qdrant...");
	let processed = 0;

	for (let i = 0; i < changedChunks.length; i += BATCH_SIZE) {
		const batch = changedChunks.slice(i, i + BATCH_SIZE);

		// Prepare points with text for Qdrant Inference
		const points = batch.map((chunk) => ({
			id: chunk.chunk_id,
			text: chunk.text,
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

export type PruneResult = {
	deletedCount: number;
};

/**
 * Remove points from Qdrant whose chunk_id is not in the current set.
 * Call after ingestChunks to keep Qdrant in sync with the source of truth.
 */
export async function pruneOrphans(
	currentChunkIds: string[],
): Promise<PruneResult> {
	const existingIds = await listAllChunkIds();
	const currentSet = new Set(currentChunkIds);
	const orphanIds = existingIds.filter((id) => !currentSet.has(id));

	console.log(`Existing Qdrant chunks: ${existingIds.length}`);
	console.log(`Orphan chunks to delete: ${orphanIds.length}`);

	if (orphanIds.length === 0) {
		return { deletedCount: 0 };
	}

	let deleted = 0;
	for (let i = 0; i < orphanIds.length; i += BATCH_SIZE) {
		const batch = orphanIds.slice(i, i + BATCH_SIZE);
		await withRetry(() => deletePointsByChunkIds(batch));
		deleted += batch.length;
		console.log(`  Prune progress: ${deleted}/${orphanIds.length}`);
		await sleep(100);
	}

	return { deletedCount: deleted };
}

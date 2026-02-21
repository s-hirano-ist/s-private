import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";
import type { QdrantPayload } from "./config.ts";
import { ingestChunks } from "./ingest.ts";
import { getExistingHashes, upsertPoints } from "./qdrant-client.ts";

vi.mock("./qdrant-client.ts", () => ({
	getExistingHashes: vi.fn(),
	upsertPoints: vi.fn(),
}));

const mockedGetExistingHashes = getExistingHashes as Mock;
const mockedUpsertPoints = upsertPoints as Mock;

function makeChunk(id: string, hash: string): QdrantPayload {
	return {
		type: "markdown_note",
		content_type: "notes",
		top_heading: "Test",
		doc_id: `doc:${id}`,
		chunk_id: id,
		title: `Chunk ${id}`,
		heading_path: ["Test"],
		text: `Content for ${id}`,
		content_hash: hash,
	};
}

function makeEmbedFn(): Mock {
	return vi
		.fn()
		.mockImplementation((texts: string[]) =>
			Promise.resolve(texts.map(() => [0.1, 0.2, 0.3])),
		);
}

describe("ingestChunks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedUpsertPoints.mockResolvedValue(undefined);
	});

	test("skips unchanged chunks based on hash match", async () => {
		const chunks = [makeChunk("c1", "hash-a"), makeChunk("c2", "hash-b")];
		mockedGetExistingHashes.mockResolvedValue(
			new Map([
				["c1", "hash-a"],
				["c2", "hash-b"],
			]),
		);
		const embedFn = makeEmbedFn();

		const result = await ingestChunks(chunks, { embedBatchFn: embedFn });

		expect(result.totalChunks).toBe(2);
		expect(result.changedChunks).toBe(0);
		expect(result.skippedChunks).toBe(2);
		expect(embedFn).not.toHaveBeenCalled();
		expect(mockedUpsertPoints).not.toHaveBeenCalled();
	});

	test("processes chunks with mismatched hashes", async () => {
		const chunks = [makeChunk("c1", "hash-new"), makeChunk("c2", "hash-b")];
		mockedGetExistingHashes.mockResolvedValue(
			new Map([
				["c1", "hash-old"],
				["c2", "hash-b"],
			]),
		);
		const embedFn = makeEmbedFn();

		const result = await ingestChunks(chunks, { embedBatchFn: embedFn });

		expect(result.changedChunks).toBe(1);
		expect(result.skippedChunks).toBe(1);
		expect(embedFn).toHaveBeenCalledOnce();
		expect(mockedUpsertPoints).toHaveBeenCalledOnce();
	});

	test("processes new chunks not in existing hashes", async () => {
		const chunks = [makeChunk("c1", "hash-a")];
		mockedGetExistingHashes.mockResolvedValue(new Map());
		const embedFn = makeEmbedFn();

		const result = await ingestChunks(chunks, { embedBatchFn: embedFn });

		expect(result.changedChunks).toBe(1);
		expect(result.skippedChunks).toBe(0);
		expect(embedFn).toHaveBeenCalledOnce();
	});

	test("force mode skips getExistingHashes and processes all chunks", async () => {
		const chunks = [makeChunk("c1", "hash-a"), makeChunk("c2", "hash-b")];
		const embedFn = makeEmbedFn();

		const result = await ingestChunks(chunks, {
			embedBatchFn: embedFn,
			force: true,
		});

		expect(mockedGetExistingHashes).not.toHaveBeenCalled();
		expect(result.changedChunks).toBe(2);
		expect(result.skippedChunks).toBe(0);
		expect(embedFn).toHaveBeenCalledOnce();
	});

	test("batches processing in groups of 20", async () => {
		const chunks = Array.from({ length: 45 }, (_, i) =>
			makeChunk(`c${i}`, `hash-${i}`),
		);
		const embedFn = makeEmbedFn();

		await ingestChunks(chunks, { embedBatchFn: embedFn, force: true });

		// 45 chunks / 20 batch size = 3 batches
		expect(embedFn).toHaveBeenCalledTimes(3);
		expect(mockedUpsertPoints).toHaveBeenCalledTimes(3);

		// Verify batch sizes
		expect(embedFn.mock.calls[0][0]).toHaveLength(20);
		expect(embedFn.mock.calls[1][0]).toHaveLength(20);
		expect(embedFn.mock.calls[2][0]).toHaveLength(5);
	});

	test("returns early for empty input", async () => {
		const embedFn = makeEmbedFn();

		const result = await ingestChunks([], { embedBatchFn: embedFn });

		expect(result.totalChunks).toBe(0);
		expect(result.changedChunks).toBe(0);
		expect(embedFn).not.toHaveBeenCalled();
	});

	test("passes embeddings and payloads correctly to upsertPoints", async () => {
		const chunk = makeChunk("c1", "hash-a");
		const embedFn = vi.fn().mockResolvedValue([[1.0, 2.0, 3.0]]);

		await ingestChunks([chunk], { embedBatchFn: embedFn, force: true });

		expect(mockedUpsertPoints).toHaveBeenCalledWith([
			{
				id: "c1",
				vector: [1.0, 2.0, 3.0],
				payload: chunk,
			},
		]);
	});
});

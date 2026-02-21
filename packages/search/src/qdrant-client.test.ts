import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";

const mockClient = {
	deleteCollection: vi.fn(),
	getCollections: vi.fn(),
	createCollection: vi.fn(),
	createPayloadIndex: vi.fn(),
	upsert: vi.fn(),
	retrieve: vi.fn(),
	search: vi.fn(),
	getCollection: vi.fn(),
};

vi.mock("@qdrant/js-client-rest", () => ({
	// biome-ignore lint/complexity/useArrowFunction: must be a regular function for `new` to work
	QdrantClient: vi.fn().mockImplementation(function () {
		return mockClient;
	}),
}));

describe("qdrant-client", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	async function loadModule() {
		return await import("./qdrant-client.ts");
	}

	describe("getQdrantClient", () => {
		test("creates client with provided config", async () => {
			const { QdrantClient } = await import("@qdrant/js-client-rest");
			const { getQdrantClient } = await loadModule();

			const client = getQdrantClient({
				url: "http://localhost:6333",
				apiKey: "test-key",
			});

			expect(QdrantClient).toHaveBeenCalledWith({
				url: "http://localhost:6333",
				apiKey: "test-key",
			});
			expect(client).toBeDefined();
		});

		test("falls back to environment variables", async () => {
			process.env.QDRANT_URL = "http://env-url:6333";
			process.env.QDRANT_API_KEY = "env-key";
			const { QdrantClient } = await import("@qdrant/js-client-rest");
			const { getQdrantClient } = await loadModule();

			getQdrantClient();

			expect(QdrantClient).toHaveBeenCalledWith({
				url: "http://env-url:6333",
				apiKey: "env-key",
			});
			delete process.env.QDRANT_URL;
			delete process.env.QDRANT_API_KEY;
		});

		test("throws when no URL is available", async () => {
			delete process.env.QDRANT_URL;
			const { getQdrantClient } = await loadModule();

			expect(() => getQdrantClient()).toThrow(
				"QDRANT_URL environment variable is required",
			);
		});

		test("returns singleton on subsequent calls", async () => {
			const { QdrantClient } = await import("@qdrant/js-client-rest");
			const { getQdrantClient } = await loadModule();

			const first = getQdrantClient({ url: "http://localhost:6333" });
			const second = getQdrantClient();

			expect(first).toBe(second);
			expect(QdrantClient).toHaveBeenCalledTimes(1);
		});
	});

	describe("deleteCollection", () => {
		test("delegates to qdrant client", async () => {
			mockClient.deleteCollection.mockResolvedValue(true);
			const { deleteCollection, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			await deleteCollection("test-collection");

			expect(mockClient.deleteCollection).toHaveBeenCalledWith(
				"test-collection",
			);
		});
	});

	describe("ensureCollection", () => {
		test("creates collection when it does not exist", async () => {
			mockClient.getCollections.mockResolvedValue({ collections: [] });
			mockClient.createCollection.mockResolvedValue(true);
			mockClient.createPayloadIndex.mockResolvedValue({});
			const { ensureCollection, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			await ensureCollection();

			expect(mockClient.createCollection).toHaveBeenCalledOnce();
			expect(mockClient.createPayloadIndex).toHaveBeenCalledTimes(3);
		});

		test("skips creation when collection already exists", async () => {
			mockClient.getCollections.mockResolvedValue({
				collections: [{ name: "knowledge_v2" }],
			});
			mockClient.createPayloadIndex.mockResolvedValue({});
			const { ensureCollection, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			await ensureCollection();

			expect(mockClient.createCollection).not.toHaveBeenCalled();
			expect(mockClient.createPayloadIndex).toHaveBeenCalledTimes(3);
		});

		test("creates payload indexes for type, top_heading, content_type", async () => {
			mockClient.getCollections.mockResolvedValue({
				collections: [{ name: "knowledge_v2" }],
			});
			mockClient.createPayloadIndex.mockResolvedValue({});
			const { ensureCollection, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			await ensureCollection();

			expect(mockClient.createPayloadIndex).toHaveBeenNthCalledWith(
				1,
				expect.any(String),
				expect.objectContaining({
					field_name: "type",
					field_schema: "keyword",
				}),
			);
			expect(mockClient.createPayloadIndex).toHaveBeenNthCalledWith(
				2,
				expect.any(String),
				expect.objectContaining({
					field_name: "top_heading",
					field_schema: "keyword",
				}),
			);
			expect(mockClient.createPayloadIndex).toHaveBeenNthCalledWith(
				3,
				expect.any(String),
				expect.objectContaining({
					field_name: "content_type",
					field_schema: "keyword",
				}),
			);
		});
	});

	describe("upsertPoints", () => {
		test("converts string IDs to numeric via hashToUint and upserts", async () => {
			mockClient.upsert.mockResolvedValue({});
			const { upsertPoints, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			await upsertPoints([
				{
					id: "chunk-1",
					vector: [0.1, 0.2],
					payload: {
						type: "markdown_note",
						content_type: "notes",
						top_heading: "Test",
						doc_id: "doc1",
						chunk_id: "chunk-1",
						title: "Test",
						heading_path: [],
						text: "hello",
						content_hash: "abc",
					},
				},
			]);

			expect(mockClient.upsert).toHaveBeenCalledOnce();
			const call = mockClient.upsert.mock.calls[0];
			expect(call[0]).toBe("knowledge_v2");
			const point = call[1].points[0];
			expect(typeof point.id).toBe("number");
			expect(point.id).toBeGreaterThanOrEqual(0);
			expect(point.vector).toEqual([0.1, 0.2]);
		});
	});

	describe("getExistingHashes", () => {
		test("builds hash map from retrieved points", async () => {
			mockClient.retrieve.mockResolvedValue([
				{
					payload: { chunk_id: "c1", content_hash: "hash-a" },
				},
				{
					payload: { chunk_id: "c2", content_hash: "hash-b" },
				},
			]);
			const { getExistingHashes, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			const result = await getExistingHashes(["c1", "c2"]);

			expect(result.get("c1")).toBe("hash-a");
			expect(result.get("c2")).toBe("hash-b");
		});

		test("returns empty map for empty input", async () => {
			const { getExistingHashes, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			const result = await getExistingHashes([]);

			expect(result.size).toBe(0);
			expect(mockClient.retrieve).not.toHaveBeenCalled();
		});

		test("returns empty map on error", async () => {
			mockClient.retrieve.mockRejectedValue(new Error("connection error"));
			const { getExistingHashes, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			const result = await getExistingHashes(["c1"]);

			expect(result.size).toBe(0);
		});
	});

	describe("search", () => {
		const mockSearchResult = [
			{
				score: 0.95,
				payload: {
					text: "hello world",
					title: "Test Doc",
					url: "https://example.com",
					heading_path: ["H1"],
					type: "markdown_note",
					content_type: "notes",
					doc_id: "doc1",
				},
			},
		];

		test("returns mapped search results", async () => {
			mockClient.search.mockResolvedValue(mockSearchResult);
			const { search, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			const results = await search([0.1, 0.2]);

			expect(results).toEqual([
				{
					score: 0.95,
					text: "hello world",
					title: "Test Doc",
					url: "https://example.com",
					heading_path: ["H1"],
					type: "markdown_note",
					content_type: "notes",
					doc_id: "doc1",
				},
			]);
		});

		test("builds filter with type condition", async () => {
			mockClient.search.mockResolvedValue([]);
			const { search, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			await search([0.1], { filter: { type: "markdown_note" } });

			expect(mockClient.search).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					filter: {
						must: [{ key: "type", match: { value: "markdown_note" } }],
					},
				}),
			);
		});

		test("builds filter with top_heading condition", async () => {
			mockClient.search.mockResolvedValue([]);
			const { search, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			await search([0.1], { filter: { top_heading: "Introduction" } });

			expect(mockClient.search).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					filter: {
						must: [{ key: "top_heading", match: { value: "Introduction" } }],
					},
				}),
			);
		});

		test("builds filter with single content_type", async () => {
			mockClient.search.mockResolvedValue([]);
			const { search, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			await search([0.1], { filter: { content_type: "articles" } });

			expect(mockClient.search).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					filter: {
						must: [{ key: "content_type", match: { value: "articles" } }],
					},
				}),
			);
		});

		test("builds filter with content_type array", async () => {
			mockClient.search.mockResolvedValue([]);
			const { search, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			await search([0.1], {
				filter: { content_type: ["articles", "books"] },
			});

			expect(mockClient.search).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					filter: {
						must: [
							{ key: "content_type", match: { any: ["articles", "books"] } },
						],
					},
				}),
			);
		});

		test("passes no filter when none specified", async () => {
			mockClient.search.mockResolvedValue([]);
			const { search, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			await search([0.1], { topK: 5 });

			const call = mockClient.search.mock.calls[0];
			expect(call[1].filter).toBeUndefined();
			expect(call[1].limit).toBe(5);
		});
	});

	describe("getCollectionStats", () => {
		test("returns collection stats", async () => {
			mockClient.getCollection.mockResolvedValue({
				points_count: 42,
				status: "green",
			});
			const { getCollectionStats, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			const stats = await getCollectionStats();

			expect(stats).toEqual({ pointsCount: 42, status: "green" });
		});

		test("returns fallback on error", async () => {
			mockClient.getCollection.mockRejectedValue(
				new Error("collection not found"),
			);
			const { getCollectionStats, getQdrantClient } = await loadModule();
			getQdrantClient({ url: "http://localhost:6333" });

			const stats = await getCollectionStats();

			expect(stats).toEqual({ pointsCount: 0, status: "not_found" });
		});
	});
});

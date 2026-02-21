import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { RAG_CONFIG } from "./config.ts";
import { createEmbeddingClient } from "./embedding-client.ts";

const CLIENT_CONFIG = {
	apiUrl: "https://embed.example.com",
	cfAccessClientId: "cf-id",
	cfAccessClientSecret: "cf-secret",
};

describe("createEmbeddingClient", () => {
	let fetchSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		fetchSpy = vi.spyOn(globalThis, "fetch");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("embed", () => {
		test("sends request with query prefix when isQuery is true", async () => {
			const mockEmbedding = [0.1, 0.2, 0.3];
			fetchSpy.mockResolvedValue(
				new Response(JSON.stringify([mockEmbedding]), { status: 200 }),
			);

			const client = createEmbeddingClient(CLIENT_CONFIG);
			const result = await client.embed("hello world", true);

			expect(result).toEqual(mockEmbedding);
			expect(fetchSpy).toHaveBeenCalledExactlyOnceWith(
				"https://embed.example.com/embed",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({
						inputs: `${RAG_CONFIG.embedding.prefix.query}hello world`,
						normalize: true,
						truncate: true,
					}),
				}),
			);
		});

		test("sends request with passage prefix when isQuery is false", async () => {
			fetchSpy.mockResolvedValue(
				new Response(JSON.stringify([[0.4, 0.5]]), { status: 200 }),
			);

			const client = createEmbeddingClient(CLIENT_CONFIG);
			await client.embed("document text", false);

			const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
			expect(body.inputs).toBe(
				`${RAG_CONFIG.embedding.prefix.passage}document text`,
			);
		});

		test("sends request with passage prefix by default", async () => {
			fetchSpy.mockResolvedValue(
				new Response(JSON.stringify([[0.4, 0.5]]), { status: 200 }),
			);

			const client = createEmbeddingClient(CLIENT_CONFIG);
			await client.embed("document text");

			const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
			expect(body.inputs).toBe(
				`${RAG_CONFIG.embedding.prefix.passage}document text`,
			);
		});

		test("includes Cloudflare Access headers", async () => {
			fetchSpy.mockResolvedValue(
				new Response(JSON.stringify([[0.1]]), { status: 200 }),
			);

			const client = createEmbeddingClient(CLIENT_CONFIG);
			await client.embed("test");

			expect(fetchSpy).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: {
						"Content-Type": "application/json",
						"CF-Access-Client-Id": "cf-id",
						"CF-Access-Client-Secret": "cf-secret",
					},
				}),
			);
		});

		test("throws on non-ok response", async () => {
			fetchSpy.mockResolvedValue(new Response("rate limited", { status: 429 }));

			const client = createEmbeddingClient(CLIENT_CONFIG);

			await expect(client.embed("test")).rejects.toThrow(
				"Embedding API returned 429: rate limited",
			);
		});
	});

	describe("embedBatch", () => {
		test("sends batch request with prefix applied to all texts", async () => {
			const mockEmbeddings = [
				[0.1, 0.2],
				[0.3, 0.4],
			];
			fetchSpy.mockResolvedValue(
				new Response(JSON.stringify(mockEmbeddings), { status: 200 }),
			);

			const client = createEmbeddingClient(CLIENT_CONFIG);
			const result = await client.embedBatch(["text1", "text2"], true);

			expect(result).toEqual(mockEmbeddings);
			const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
			expect(body.inputs).toEqual([
				`${RAG_CONFIG.embedding.prefix.query}text1`,
				`${RAG_CONFIG.embedding.prefix.query}text2`,
			]);
			expect(body.normalize).toBe(true);
			expect(body.truncate).toBe(true);
		});

		test("uses passage prefix by default", async () => {
			fetchSpy.mockResolvedValue(
				new Response(JSON.stringify([[0.1]]), { status: 200 }),
			);

			const client = createEmbeddingClient(CLIENT_CONFIG);
			await client.embedBatch(["text1"]);

			const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
			expect(body.inputs).toEqual([
				`${RAG_CONFIG.embedding.prefix.passage}text1`,
			]);
		});

		test("throws on non-ok response", async () => {
			fetchSpy.mockResolvedValue(new Response("server error", { status: 500 }));

			const client = createEmbeddingClient(CLIENT_CONFIG);

			await expect(client.embedBatch(["test"])).rejects.toThrow(
				"Embedding API returned 500: server error",
			);
		});
	});
});

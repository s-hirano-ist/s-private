import { createBackendClient } from "@s-hirano-ist/s-api-client";
import {
	ApiHttpError,
	ApiProtocolError,
	createApiFetch,
} from "@s-hirano-ist/s-api-client/transport";
import { describe, expect, test, vi } from "vitest";

const baseURL = "https://backend.example/api/v1";
const article = {
	id: "article-1",
	title: "Title",
	url: "https://example.com",
	quote: null,
	categoryId: "category-1",
	categoryName: "Category",
	status: "UNEXPORTED",
	createdAt: "2026-10-11T00:00:00.000Z",
	updatedAt: "2026-10-11T00:00:00Z",
	exportedAt: null,
};
const page = { data: [article], totalCount: 1, offset: 0, limit: 30 };

describe("Generated backend client", () => {
	test("validates a domain-specific response and keeps credentials request scoped", async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockImplementation(async () => Response.json(page));
		const alice = createBackendClient({
			baseURL,
			fetch,
			headers: { Cookie: "session=alice" },
		});
		const bob = createBackendClient({
			baseURL,
			fetch,
			headers: { Cookie: "session=bob" },
		});
		const result = await alice.listArticles({ status: "UNEXPORTED" });
		await bob.listArticles();
		expect(result.data.data[0].url).toBe(article.url);
		expect(result.data.data[0].exportedAt).toBeNull();
		expect(fetch.mock.calls[0][0]).toEqual(
			new URL(`${baseURL}/articles?status=UNEXPORTED`),
		);
		expect(new Headers(fetch.mock.calls[0][1]?.headers).get("cookie")).toBe(
			"session=alice",
		);
		expect(new Headers(fetch.mock.calls[1][1]?.headers).get("cookie")).toBe(
			"session=bob",
		);
		expect(fetch.mock.calls[0][1]).toMatchObject({
			cache: "no-store",
			redirect: "error",
		});
	});
	test("returns a typed HTTP error without retrying a mutation", async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValue(
				Response.json(
					{ error: { code: "OPERATION_CONFLICT" } },
					{ status: 409 },
				),
			);
		const client = createBackendClient({ baseURL, fetch });
		await expect(
			client.createNotes({
				operationId: "6ab4a998-177a-4a34-ae38-9f5e75a05b2c",
				title: "Title",
				markdown: "Body",
			}),
		).rejects.toMatchObject({ status: 409, code: "OPERATION_CONFLICT" });
		expect(fetch).toHaveBeenCalledExactlyOnceWith(
			expect.any(URL),
			expect.objectContaining({ method: "POST" }),
		);
	});
	test("preserves authentication failures and expired upload errors", async () => {
		const client = createBackendClient({
			baseURL,
			fetch: async () =>
				Response.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }),
		});
		await expect(client.listArticles()).rejects.toBeInstanceOf(ApiHttpError);
		const expired = createBackendClient({
			baseURL,
			fetch: async () =>
				Response.json({ error: { code: "UPLOAD_EXPIRED" } }, { status: 410 }),
		});
		await expect(expired.getUpload("expired")).rejects.toMatchObject({
			status: 410,
			code: "UPLOAD_EXPIRED",
		});
	});
	test.each([
		{
			name: "wrong domain",
			payload: {
				...page,
				data: [{ ...article, url: undefined, markdown: "Note" }],
			},
		},
		{
			name: "invalid timestamp",
			payload: { ...page, data: [{ ...article, updatedAt: "yesterday" }] },
		},
		{
			name: "unknown enum",
			payload: { ...page, data: [{ ...article, status: "UNKNOWN" }] },
		},
	])("rejects $name in successful JSON", async ({ payload }) => {
		const client = createBackendClient({
			baseURL,
			fetch: async () => Response.json(payload),
		});
		await expect(client.listArticles()).rejects.toBeInstanceOf(
			ApiProtocolError,
		);
	});
	test("rejects malformed error bodies and unexpected successful statuses", async () => {
		const malformed = createBackendClient({
			baseURL,
			fetch: async () =>
				Response.json({ error: { code: "UNKNOWN" } }, { status: 500 }),
		});
		await expect(malformed.listArticles()).rejects.toBeInstanceOf(
			ApiProtocolError,
		);
		const unexpected = createBackendClient({
			baseURL,
			fetch: async () => Response.json(page, { status: 202 }),
		});
		await expect(unexpected.listArticles()).rejects.toBeInstanceOf(
			ApiProtocolError,
		);
	});
	test("rejects a non-JSON response instead of casting HTML to a record", async () => {
		const client = createBackendClient({
			baseURL,
			fetch: async () =>
				new Response("<html>login</html>", {
					headers: { "Content-Type": "text/html" },
				}),
		});
		await expect(client.listArticles()).rejects.toBeInstanceOf(
			ApiProtocolError,
		);
	});
	test("rejects invalid JSON as a protocol error", async () => {
		const client = createBackendClient({
			baseURL,
			fetch: async () =>
				new Response("{", { headers: { "Content-Type": "application/json" } }),
		});
		await expect(client.listArticles()).rejects.toBeInstanceOf(
			ApiProtocolError,
		);
	});
	test("normalizes empty responses and transfers binary bytes", async () => {
		const empty = createBackendClient({
			baseURL,
			fetch: async () => new Response(null, { status: 204 }),
		});
		const deleted = await empty.deleteArticles("article-1");
		expect(deleted.status).toBe(204);
		expect(deleted.data).toBeUndefined();
		const binary = createBackendClient({
			baseURL,
			fetch: async () =>
				new Response(new Uint8Array([1, 2, 3]), {
					headers: { "Content-Type": "image/jpeg" },
				}),
		});
		const media = await binary.getMedia("images", "image-1", "original");
		expect([...new Uint8Array(await media.data.arrayBuffer())]).toEqual([
			1, 2, 3,
		]);
	});
	test("encodes reserved characters in path parameters", async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockImplementation(async () => Response.json(article));
		await createBackendClient({ baseURL, fetch }).getArticles(
			"id/with?reserved#chars",
		);
		expect(fetch.mock.calls[0][0]).toEqual(
			new URL(`${baseURL}/articles/id%2Fwith%3Freserved%23chars`),
		);
	});
	test("rejects paths outside the backend before sending credentials", async () => {
		const fetch = vi.fn<typeof globalThis.fetch>();
		const transport = createApiFetch({
			baseURL,
			fetch,
			headers: { Authorization: "Bearer test" },
		});
		await expect(transport("//other.example/articles")).rejects.toBeInstanceOf(
			ApiProtocolError,
		);
		await expect(transport("/../articles")).rejects.toBeInstanceOf(
			ApiProtocolError,
		);
		expect(fetch).not.toHaveBeenCalled();
	});
});

test("rejects error codes assigned to a different HTTP status", async () => {
	const client = createBackendClient({
		baseURL: "https://backend.example/api/v1",
		fetch: async () =>
			Response.json({ error: { code: "UPLOAD_EXPIRED" } }, { status: 401 }),
	});
	await expect(client.listArticles()).rejects.toBeInstanceOf(ApiProtocolError);
});

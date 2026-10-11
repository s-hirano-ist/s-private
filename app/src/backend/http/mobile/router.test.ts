import { createMobileApp } from "@/backend/http/mobile/router";
import { describe, expect, test, vi } from "vitest";

function makeHandler(controller: string) {
	return vi.fn(async (request: Request, params: object = {}) =>
		Response.json({
			controller,
			method: request.method,
			params,
			authorization: request.headers.get("authorization"),
			query: new URL(request.url).search,
		}),
	);
}
function makeControllers() {
	return {
		content: { GET: makeHandler("content"), POST: makeHandler("content") },
		detail: { GET: makeHandler("detail"), DELETE: makeHandler("detail") },
		categories: { GET: makeHandler("categories") },
		manifest: { GET: makeHandler("manifest") },
		search: { GET: makeHandler("search") },
		syncHead: { GET: makeHandler("syncHead") },
		syncSnapshot: { GET: makeHandler("syncSnapshot") },
		syncChanges: { GET: makeHandler("syncChanges") },
		uploads: { POST: makeHandler("uploads") },
		upload: { GET: makeHandler("upload"), DELETE: makeHandler("upload") },
		uploadChunk: { PUT: makeHandler("uploadChunk") },
		uploadComplete: { POST: makeHandler("uploadComplete") },
		media: { GET: makeHandler("media") },
	};
}

describe("Hono mobile router", () => {
	test.each([
		["GET", "/articles?limit=3", "content", { domain: "articles" }],
		["POST", "/notes", "content", { domain: "notes" }],
		[
			"GET",
			"/books/id%2Fencoded",
			"detail",
			{ domain: "books", id: "id/encoded" },
		],
		[
			"DELETE",
			"/images/image-1",
			"detail",
			{ domain: "images", id: "image-1" },
		],
		["GET", "/categories", "categories", {}],
		["GET", "/manifest", "manifest", {}],
		["GET", "/search?query=hello", "search", {}],
		["GET", "/sync/head", "syncHead", {}],
		["GET", "/sync/snapshot?domain=notes", "syncSnapshot", {}],
		["GET", "/sync/changes?cursor=test", "syncChanges", {}],
		["POST", "/uploads", "uploads", {}],
		["GET", "/uploads/u1", "upload", { id: "u1" }],
		["DELETE", "/uploads/u1", "upload", { id: "u1" }],
		["PUT", "/uploads/u1/chunks/2", "uploadChunk", { id: "u1", part: "2" }],
		["POST", "/uploads/u1/complete", "uploadComplete", { id: "u1" }],
		[
			"GET",
			"/media/images/i1/thumbnail",
			"media",
			{ domain: "images", id: "i1", variant: "thumbnail" },
		],
	] as const)(
		"routes %s %s with request-scoped credentials",
		async (method, path, controller, params) => {
			const controllers = makeControllers();
			const app = createMobileApp(controllers);
			const response = await app.request(`/api/mobile/v1${path}`, {
				method,
				headers: { Authorization: "Bearer test" },
			});
			expect(response.status).toBe(200);
			expect(response.headers.get("cache-control")).toBe("no-store");
			expect(await response.json()).toMatchObject({
				controller,
				method,
				params,
				authorization: "Bearer test",
				query: new URL(path, "http://localhost").search,
			});
		},
	);
	test("does not consume upload bytes before the controller", async () => {
		const controllers = makeControllers();
		controllers.uploadChunk.PUT.mockImplementation(
			async (request) => new Response(await request.arrayBuffer()),
		);
		const bytes = new Uint8Array([0, 255, 128, 1]);
		const response = await createMobileApp(controllers).request(
			"/api/mobile/v1/uploads/u1/chunks/0",
			{ method: "PUT", body: bytes },
		);
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
	});
	test("streams media and preserves private cache headers", async () => {
		const controllers = makeControllers();
		controllers.media.GET.mockImplementation(
			async () =>
				new Response(
					new ReadableStream({
						start(controller) {
							controller.enqueue(new Uint8Array([1, 2, 3]));
							controller.close();
						},
					}),
					{
						headers: {
							"Content-Type": "image/webp",
							"Cache-Control": "private, no-store",
						},
					},
				),
		);
		const response = await createMobileApp(controllers).request(
			"/api/mobile/v1/media/books/b1/thumbnail",
		);
		expect(response.headers.get("cache-control")).toBe("private, no-store");
		expect(response.headers.get("content-type")).toBe("image/webp");
		expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([
			1, 2, 3,
		]);
	});
	test("handles HEAD and OPTIONS and rejects unsupported methods before content routing", async () => {
		const controllers = makeControllers();
		const app = createMobileApp(controllers);
		const head = await app.request("/api/mobile/v1/categories", {
			method: "HEAD",
		});
		expect(head.status).toBe(200);
		expect(await head.text()).toBe("");
		const options = await app.request("/api/mobile/v1/categories", {
			method: "OPTIONS",
		});
		expect(options.status).toBe(204);
		expect(options.headers.get("allow")).toBe("GET, HEAD, OPTIONS");
		const rejected = await app.request("/api/mobile/v1/categories", {
			method: "POST",
		});
		expect(rejected.status).toBe(405);
		expect(controllers.content.POST).not.toHaveBeenCalled();
	});
	test("returns a non-cacheable, sanitized error for an unexpected controller failure", async () => {
		const controllers = makeControllers();
		controllers.categories.GET.mockRejectedValue(
			new Error("private database URL"),
		);
		const response = await createMobileApp(controllers).request(
			"/api/mobile/v1/categories",
		);
		expect(response.status).toBe(500);
		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(await response.json()).toEqual({
			error: { code: "INTERNAL_ERROR" },
		});
	});
});

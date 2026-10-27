import type { PushService } from "s-private-backend/api/push-service";
import type { ReadService } from "s-private-backend/api/read-service";
import type { ApiAuth } from "s-private-backend/api/types";
import type { UploadService } from "s-private-backend/api/upload-service";
import type { WriteService } from "s-private-backend/api/write-service";
import { apiRoutes } from "@s-hirano-ist/s-api-contracts/routes";
import { createApiApp } from "s-private-backend/api/app";
import { ApiError } from "s-private-backend/api/error";
import { tenantContext } from "s-private-backend/shared/tenant-context";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

const session = {
	user: { id: "owner", name: "Name", email: "owner@example.com", image: null },
	expiresAt: "2026-10-12T00:00:00Z",
};
const note = {
	id: "note",
	title: "Title",
	markdown: "Body",
	status: "UNEXPORTED",
	createdAt: "2026-10-11T00:00:00Z",
	updatedAt: "2026-10-11T00:00:00Z",
	exportedAt: null,
};
function fixture() {
	const auth = {
		authenticateBearer: vi
			.fn<ApiAuth["authenticateBearer"]>()
			.mockResolvedValue("bearer-owner"),
		getWebSession: vi.fn<ApiAuth["getWebSession"]>().mockResolvedValue({
			session,
			headers: new Headers({ "set-cookie": "session=refreshed; HttpOnly" }),
		}),
		isTrustedOrigin: vi.fn(
			(origin: string) => origin === "https://web.example",
		),
		reportError: vi.fn(),
	};
	const reads = {
		detail: vi.fn<ReadService["detail"]>().mockResolvedValue(note),
		page: vi.fn<ReadService["page"]>(),
		count: vi.fn<ReadService["count"]>(),
		lookup: vi.fn<ReadService["lookup"]>().mockResolvedValue(note),
		categories: vi.fn<ReadService["categories"]>().mockResolvedValue([]),
		head: vi.fn<ReadService["head"]>(),
		snapshot: vi.fn<ReadService["snapshot"]>(),
		changes: vi.fn<ReadService["changes"]>(),
		media: vi.fn<ReadService["media"]>(),
		search: vi.fn<ReadService["search"]>(),
	};
	const writes = {
		article: vi.fn<WriteService["article"]>(),
		note: vi.fn<WriteService["note"]>(),
		media: vi.fn<WriteService["media"]>(),
		remove: vi.fn<WriteService["remove"]>(),
	};
	const uploads = {
		start: vi.fn<UploadService["start"]>(),
		get: vi.fn<UploadService["get"]>(),
		put: vi.fn<UploadService["put"]>(),
		complete: vi.fn<UploadService["complete"]>(),
		cancel: vi.fn<UploadService["cancel"]>(),
	};
	const push = {
		subscribe: vi.fn<PushService["subscribe"]>(),
		unsubscribe: vi.fn<PushService["unsubscribe"]>(),
		test: vi.fn<PushService["test"]>(),
	};
	return {
		push,
		auth,
		reads,
		writes,
		uploads,
		app: createApiApp(auth, reads, { writes, uploads, push }),
	};
}
describe("Shared Hono API boundary", () => {
	test("establishes the cookie owner and tenant, strips internal fields, forwards refreshed cookies", async () => {
		const { app, reads } = fixture();
		reads.detail.mockImplementation(async (_domain, owner) => {
			expect(owner).toBe("owner");
			expect(tenantContext.getStore()?.userId).toBe(owner);
			return { ...note, userId: owner };
		});
		const response = await app.request("/api/v1/notes/note");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(note);
		expect(response.headers.get("cache-control")).toBe("private, no-store");
		expect(response.headers.getSetCookie()).toEqual([
			"session=refreshed; HttpOnly",
		]);
		expect(tenantContext.getStore()).toBeUndefined();
	});
	test("rejects unauthenticated cookies before any content query", async () => {
		const { app, auth, reads } = fixture();
		auth.getWebSession.mockResolvedValue({ session: null });
		const response = await app.request("/api/v1/notes/note");
		expect(response.status).toBe(401);
		expect(reads.detail).not.toHaveBeenCalled();
		expect(response.headers.get("cache-control")).toContain("no-store");
	});
	test("never falls back to a cookie after an invalid Authorization header", async () => {
		const { app, auth, reads } = fixture();
		auth.authenticateBearer.mockRejectedValue(new ApiError("UNAUTHORIZED"));
		const response = await app.request("/api/v1/notes/note", {
			headers: { authorization: "Bearer invalid", cookie: "session=valid" },
		});
		expect(response.status).toBe(401);
		expect(auth.getWebSession).not.toHaveBeenCalled();
		expect(reads.detail).not.toHaveBeenCalled();
	});
	test("Bearer requests use the linked owner and cannot retrieve a Web session", async () => {
		const { app, reads } = fixture();
		await app.request("/api/v1/notes/note", {
			headers: { authorization: "Bearer valid" },
		});
		expect(reads.detail).toHaveBeenCalledWith("notes", "bearer-owner", "note");
		expect(
			(
				await app.request("/api/v1/session", {
					headers: { authorization: "Bearer valid" },
				})
			).status,
		).toBe(401);
	});
	test("rejects invalid pagination before a database read", async () => {
		const { app, reads } = fixture();
		const response = await app.request("/api/v1/articles?limit=101");
		expect(response.status).toBe(422);
		expect(reads.page).not.toHaveBeenCalled();
		expect(await response.json()).toEqual({
			error: { code: "VALIDATION_ERROR" },
		});
	});
	test("treats a malformed persisted DTO as a server error without exposing its data", async () => {
		const { app, reads, auth } = fixture();
		reads.detail.mockResolvedValue({ userId: "secret" });
		const response = await app.request("/api/v1/notes/note");
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			error: { code: "INTERNAL_ERROR" },
		});
		expect(auth.reportError).toHaveBeenCalledOnce();
	});
	test("keeps missing and foreign-owned resources indistinguishable", async () => {
		const { app, reads } = fixture();
		reads.detail.mockRejectedValue(new ApiError("NOT_FOUND"));
		const response = await app.request("/api/v1/notes/foreign");
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: { code: "NOT_FOUND" } });
	});
	test("requires a trusted Origin for cookie mutations", async () => {
		const { app } = fixture();
		expect(
			(
				await app.request("/api/v1/notes", {
					method: "POST",
					headers: { origin: "https://attacker.example" },
				})
			).status,
		).toBe(403);
		expect(
			(await app.request("/api/v1/notes", { method: "POST" })).status,
		).toBe(403);
	});
	test("resolves encoded note titles through a separate typed lookup route", async () => {
		const { app, reads } = fixture();
		expect((await app.request("/api/v1/notes/title/My%20note")).status).toBe(
			200,
		);
		expect(reads.lookup).toHaveBeenCalledWith("notes", "owner", "My note");
	});
	test("returns 422 for malformed JSON without executing a mutation", async () => {
		const { app, writes } = fixture();
		const response = await app.request("/api/v1/notes", {
			method: "POST",
			headers: {
				authorization: "Bearer valid",
				"content-type": "application/json",
			},
			body: "{",
		});
		expect(response.status).toBe(422);
		expect(writes.note).not.toHaveBeenCalled();
	});
	test("rejects chunks above the contract limit before persistence", async () => {
		const { app, uploads } = fixture();
		const response = await app.request("/api/v1/uploads/upload/chunks/0", {
			method: "PUT",
			headers: {
				authorization: "Bearer valid",
				"content-type": "application/octet-stream",
			},
			body: new Uint8Array(1024 * 1024 + 1),
		});
		expect(response.status).toBe(413);
		expect(uploads.put).not.toHaveBeenCalled();
	});
	test("passes binary bytes and the Bearer owner to the chunk service", async () => {
		const { app, uploads } = fixture();
		uploads.put.mockResolvedValue({ accepted: true, part: 0 });
		const response = await app.request("/api/v1/uploads/upload/chunks/0", {
			method: "PUT",
			headers: {
				authorization: "Bearer valid",
				"content-type": "application/octet-stream",
			},
			body: new Uint8Array([1, 2, 3]),
		});
		expect(response.status).toBe(200);
		expect(uploads.put).toHaveBeenCalledWith(
			"bearer-owner",
			"upload",
			0,
			new Uint8Array([1, 2, 3]),
		);
	});
	test("routes cookie push registration and deletion through the same owner", async () => {
		const { app, push } = fixture();
		const endpoint = "https://push.example/subscription";
		const headers = {
			origin: "https://web.example",
			"content-type": "application/json",
		};
		expect(
			(
				await app.request("/api/v1/push/subscriptions", {
					method: "POST",
					headers,
					body: JSON.stringify({
						endpoint,
						keys: { auth: "auth", p256dh: "key" },
					}),
				})
			).status,
		).toBe(204);
		expect(push.subscribe).toHaveBeenCalledWith("owner", {
			endpoint,
			keys: { auth: "auth", p256dh: "key" },
		});
		expect(
			(
				await app.request("/api/v1/push/subscriptions", {
					method: "DELETE",
					headers,
					body: JSON.stringify({ endpoint }),
				})
			).status,
		).toBe(204);
		expect(push.unsubscribe).toHaveBeenCalledWith("owner", endpoint);
	});
	test("keeps push CSRF validation and missing-subscription errors at the API boundary", async () => {
		const { app, push } = fixture();
		const body = JSON.stringify({
			endpoint: "https://push.example/subscription",
		});
		expect(
			(
				await app.request("/api/v1/push/test", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body,
				})
			).status,
		).toBe(403);
		expect(push.test).not.toHaveBeenCalled();
		push.test.mockRejectedValue(new ApiError("NOT_FOUND"));
		expect(
			(
				await app.request("/api/v1/push/test", {
					method: "POST",
					headers: {
						"content-type": "application/json",
						authorization: "Bearer valid",
					},
					body,
				})
			).status,
		).toBe(404);
	});
});

const examples = [
	[
		"articles",
		{
			...note,
			url: "https://example.com",
			quote: null,
			categoryId: "category",
			categoryName: "Tech",
		},
	],
	["notes", note],
	[
		"images",
		{
			...note,
			path: "file.png",
			contentType: "image/png",
			fileSize: 1,
			width: null,
			height: null,
		},
	],
	[
		"books",
		{ ...note, isbn: "9780306406157", imagePath: null, rating: 3, tags: [] },
	],
] as const;
test.each(examples)(
	"shared %s routes preserve DTOs, owner and empty deletion responses",
	async (domain, record) => {
		const { app, reads, writes } = fixture();
		reads.detail.mockResolvedValue({ ...record, userId: "secret" });
		reads.page.mockResolvedValue({
			data: [{ ...record, userId: "secret" }],
			totalCount: 1,
			offset: 0,
			limit: 30,
		});
		reads.count.mockResolvedValue({ count: 1 });
		const detail = await app.request(`/api/v1/${domain}/record`);
		expect(detail.status).toBe(200);
		expect(await detail.json()).not.toHaveProperty("userId");
		expect(reads.detail).toHaveBeenCalledWith(domain, "owner", "record");
		const page = await app.request(`/api/v1/${domain}`);
		expect(page.status).toBe(200);
		expect(await page.text()).not.toContain("secret");
		expect(await (await app.request(`/api/v1/${domain}/count`)).json()).toEqual(
			{ count: 1 },
		);
		const deleted = await app.request(`/api/v1/${domain}/record`, {
			method: "DELETE",
			headers: { origin: "https://web.example" },
		});
		expect(deleted.status).toBe(204);
		expect(await deleted.text()).toBe("");
		expect(writes.remove).toHaveBeenCalledWith("owner", domain, "record");
	},
);
test("all contract operations are registered exactly once in the OpenAPI registry", () => {
	const { app } = fixture();
	const document = app.getOpenAPI31Document({
		openapi: "3.1.0",
		info: { title: "Test", version: "1" },
	});
	const registered = Object.entries(
		z
			.record(
				z.string(),
				z.record(z.string(), z.object({ operationId: z.string() })),
			)
			.parse(document.paths),
	).flatMap(([path, methods]) =>
		Object.entries(methods).map(([method, operation]) => ({
			method,
			path: path.replace("/api/v1", ""),
			operationId: operation.operationId,
		})),
	);
	expect(
		registered.toSorted((a, b) => a.operationId.localeCompare(b.operationId)),
	).toEqual(
		apiRoutes
			.map(({ method, path, operationId }) => ({ method, path, operationId }))
			.toSorted((a, b) => a.operationId.localeCompare(b.operationId)),
	);
	const runtime = new Set(
		app.routes
			.filter((route) => route.method !== "ALL")
			.map(
				(route) =>
					`${route.method.toLowerCase()} ${route.path.replace("/api/v1", "").replaceAll(/:([^/]+)/gu, "{$1}")}`,
			),
	);
	expect([...runtime].toSorted()).toEqual(
		apiRoutes.map(({ method, path }) => `${method} ${path}`).toSorted(),
	);
});
test("malformed successful service responses are rejected consistently", async () => {
	const { app, reads, auth, uploads } = fixture();
	reads.count.mockResolvedValue({ count: -1 });
	reads.head.mockResolvedValue({ cursor: null });
	uploads.start.mockResolvedValue({ uploadId: "missing-fields" });
	for (const path of ["/api/v1/notes/count", "/api/v1/sync/head"]) {
		const response = await app.request(path);
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			error: { code: "INTERNAL_ERROR" },
		});
	}
	const response = await app.request("/api/v1/uploads", {
		method: "POST",
		headers: {
			origin: "https://web.example",
			"content-type": "application/json",
		},
		body: JSON.stringify({
			operationId: "6ab4a998-177a-4a34-ae38-9f5e75a05b2c",
			domain: "images",
			contentType: "image/png",
			fileSize: 1,
			metadata: { filename: "image.png" },
		}),
	});
	expect(response.status).toBe(500);
	expect(auth.reportError).toHaveBeenCalledTimes(3);
});

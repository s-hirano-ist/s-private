import type { ReadService } from "@s-hirano-ist/s-backend/api/read-service";
import type { UploadService } from "@s-hirano-ist/s-backend/api/upload-service";
import type { WriteService } from "@s-hirano-ist/s-backend/api/write-service";
import { createApiApp, type ApiAuth } from "@s-hirano-ist/s-backend/api/app";
import { MobileApiError } from "@s-hirano-ist/s-backend/mobile/error";
import { tenantContext } from "@s-hirano-ist/s-backend/shared/tenant-context";
import { describe, expect, test, vi } from "vitest";

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
	return {
		auth,
		reads,
		writes,
		uploads,
		app: createApiApp(auth, reads, { writes, uploads }),
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
		auth.authenticateBearer.mockRejectedValue(
			new MobileApiError("UNAUTHORIZED", 401),
		);
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
		reads.detail.mockRejectedValue(new MobileApiError("NOT_FOUND", 404));
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
});

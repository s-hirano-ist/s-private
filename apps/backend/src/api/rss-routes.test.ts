import type { ApiAuth, ApiEnvironment } from "s-private-backend/api/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createRssService } from "@s-hirano-ist/s-application/rss/service";
import { apiErrorResponse } from "s-private-backend/api/error-handler";
import { registerApiMiddleware } from "s-private-backend/api/middleware";
import { registerRssRoutes } from "s-private-backend/api/rss-routes";
import { expect, test, vi } from "vitest";
function fixture() {
	const repository = {
		due: vi.fn(),
		page: vi.fn().mockResolvedValue({
			snapshotRevision: 0,
			newerCount: 0,
			offset: 0,
			feeds: [],
			unread: [],
			saved: [],
			unreadCount: 0,
			savedCount: 0,
		}),
		subscribe: vi.fn().mockResolvedValue(true),
		unsubscribe: vi.fn(),
		read: vi.fn(),
		save: vi.fn().mockResolvedValue({
			added: true,
			saved: {
				id: "00000000-0000-4000-8000-000000000001",
				url: "https://example.com/one",
				title: "One",
				publishedAt: null,
				savedAt: "2026-11-18T00:00:00Z",
			},
		}),
		unsave: vi.fn(),
		claim: vi.fn().mockResolvedValue(null),
		complete: vi.fn(),
		fail: vi.fn(),
	};
	const auth: ApiAuth = {
		authenticateBearer: vi.fn().mockResolvedValue("owner"),
		getWebSession: vi.fn().mockResolvedValue({ session: null }),
		isTrustedOrigin: () => true,
		reportError: vi.fn(),
	};
	const app = new OpenAPIHono<ApiEnvironment>({
		defaultHook: (result, c) =>
			result.success
				? undefined
				: c.json({ error: { code: "VALIDATION_ERROR" } }, 422),
	}).basePath("/api/v1");
	registerApiMiddleware(app, auth);
	app.onError((error) => apiErrorResponse(error, auth.reportError));
	registerRssRoutes(app, createRssService(repository, vi.fn(), vi.fn()));
	return { app, repository, auth };
}
test("unauthenticated RSS calls are rejected before repository access", async () => {
	const { app, repository } = fixture();
	const response = await app.request("https://web.example/api/v1/rss");
	expect(response.status).toBe(401);
	expect(repository.page).not.toHaveBeenCalled();
});
test("RSS pages use the authenticated owner and never cache private metadata", async () => {
	const { app, repository } = fixture();
	const response = await app.request(
		"https://web.example/api/v1/rss?offset=50",
		{ headers: { authorization: "Bearer valid" } },
	);
	expect(response.status).toBe(200);
	expect(response.headers.get("cache-control")).toBe("private, no-store");
	expect(repository.page).toHaveBeenCalledWith(
		"owner",
		50,
		undefined,
		"all",
		undefined,
	);
});
test("mark-all requires an explicit snapshot boundary and refresh batches are bounded", async () => {
	const { app, repository } = fixture();
	const init = {
		method: "POST",
		headers: {
			authorization: "Bearer valid",
			"content-type": "application/json",
		},
	};
	expect(
		(
			await app.request("https://web.example/api/v1/rss/read", {
				...init,
				body: "{}",
			})
		).status,
	).toBe(422);
	expect(
		(
			await app.request("https://web.example/api/v1/rss/refresh", {
				...init,
				body: JSON.stringify({
					ids: Array.from(
						{ length: 6 },
						() => "00000000-0000-4000-8000-000000000001",
					),
				}),
			})
		).status,
	).toBe(422);
	expect(repository.read).not.toHaveBeenCalled();
	expect(repository.claim).not.toHaveBeenCalled();
});
test("invalid exports return a validation error rather than partially writing arbitrary data", async () => {
	const { app, repository } = fixture();
	const response = await app.request("https://web.example/api/v1/rss/import", {
		method: "POST",
		headers: {
			authorization: "Bearer valid",
			"content-type": "application/json",
		},
		body: JSON.stringify({ kind: "starred", content: "{}" }),
	});
	expect(response.status).toBe(422);
	expect(repository.save).not.toHaveBeenCalled();
});

test("authenticated RSS mutations forward the owner and parsed input", async () => {
	const { app, repository } = fixture();
	const id = "00000000-0000-4000-8000-000000000001";
	const call = (path: string, method: string, body?: unknown) =>
		app.request(`https://web.example/api/v1/rss${path}`, {
			method,
			headers: {
				authorization: "Bearer valid",
				"content-type": "application/json",
			},
			body: JSON.stringify(body),
		});
	const feed = {
		url: "https://example.com/feed",
		title: "News",
		folder: "Tech",
	};
	const entry = {
		url: "https://example.com/one",
		title: "One",
		publishedAt: null,
	};
	expect((await call("/feeds", "POST", feed)).status).toBe(200);
	expect(repository.subscribe).toHaveBeenCalledWith("owner", feed);
	expect((await call(`/feeds/${id}`, "DELETE")).status).toBe(204);
	expect(repository.unsubscribe).toHaveBeenCalledWith("owner", id);
	expect((await call("/read", "POST", { ids: [id] })).status).toBe(204);
	expect(repository.read).toHaveBeenCalledWith("owner", { ids: [id] });
	expect((await call("/saved", "POST", entry)).status).toBe(200);
	expect(repository.save).toHaveBeenCalledWith("owner", entry);
	expect((await call(`/saved/${id}`, "DELETE")).status).toBe(204);
	expect(repository.unsave).toHaveBeenCalledWith("owner", id);
	expect(
		(await call("/refresh", "POST", { ids: [id], force: true })).status,
	).toBe(200);
	expect(repository.claim).toHaveBeenCalledWith("owner", id, true);
	const response = await call("/import", "POST", {
		kind: "starred",
		content: JSON.stringify([entry]),
	});
	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({
		added: 1,
		duplicates: 0,
		invalid: 0,
	});
});

test("snapshot query and mark-all boundary are forwarded only for the authenticated owner", async () => {
	const { app, repository } = fixture();
	const headers = {
		authorization: "Bearer valid",
		"content-type": "application/json",
	};
	expect(
		(
			await app.request(
				"https://web.example/api/v1/rss?view=unread&snapshotRevision=7",
				{ headers },
			)
		).status,
	).toBe(200);
	expect(repository.page).toHaveBeenLastCalledWith(
		"owner",
		0,
		undefined,
		"unread",
		7,
	);
	expect(
		(
			await app.request("https://web.example/api/v1/rss/read", {
				method: "POST",
				headers,
				body: JSON.stringify({ snapshotRevision: 0 }),
			})
		).status,
	).toBe(204);
	expect(repository.read).toHaveBeenLastCalledWith("owner", {
		snapshotRevision: 0,
	});
	for (const snapshotRevision of [-1, 1.5, 2147483648, "invalid"]) {
		expect(
			(
				await app.request(
					`https://web.example/api/v1/rss?snapshotRevision=${snapshotRevision}`,
					{ headers },
				)
			).status,
		).toBe(422);
		expect(
			(
				await app.request("https://web.example/api/v1/rss/read", {
					method: "POST",
					headers,
					body: JSON.stringify({ snapshotRevision }),
				})
			).status,
		).toBe(422);
	}
	expect(repository.read).toHaveBeenCalledTimes(1);
});

test("final database failures reach the HTTP reporter once and never expose database details", async () => {
	const { app, repository, auth } = fixture();
	const error = Object.assign(new Error("private database detail"), {
		code: "P2034",
	});
	repository.page.mockRejectedValue(error);
	const response = await app.request("https://web.example/api/v1/rss", {
		headers: { authorization: "Bearer valid" },
	});
	expect(response.status).toBe(500);
	expect(await response.json()).toEqual({ error: { code: "INTERNAL_ERROR" } });
	expect(auth.reportError).toHaveBeenCalledExactlyOnceWith(error);
});

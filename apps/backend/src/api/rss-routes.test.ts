import type { ApiAuth, ApiEnvironment } from "s-private-backend/api/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createRssService } from "@s-hirano-ist/s-application/rss/service";
import { apiErrorResponse } from "s-private-backend/api/error-handler";
import { registerApiMiddleware } from "s-private-backend/api/middleware";
import { registerRssRoutes } from "s-private-backend/api/rss-routes";
import { expect, test, vi } from "vitest";
function fixture() {
	const repository = {
		page: vi.fn().mockResolvedValue({
			feeds: [],
			unread: [],
			saved: [],
			unreadCount: 0,
			savedCount: 0,
		}),
		subscribe: vi.fn().mockResolvedValue(true),
		unsubscribe: vi.fn(),
		read: vi.fn(),
		save: vi.fn().mockResolvedValue(true),
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
	registerRssRoutes(app, createRssService(repository, vi.fn()));
	return { app, repository };
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
	expect(repository.page).toHaveBeenCalledWith("owner", 50, undefined);
});
test("mark-all requires an explicit time boundary and refresh batches are bounded", async () => {
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

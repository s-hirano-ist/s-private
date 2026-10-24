import { Hono } from "hono";

export function createBackendHttpApp(deps: {
	api(request: Request): Response | Promise<Response>;
	auth(request: Request): Promise<Response>;
	cron(request: Request): Promise<Response>;
	isTrustedOrigin(origin: string): boolean;
	objectStorageUnavailable?: boolean;
	publicOrigin: string;
	reportError(error: unknown): unknown;
	signIn(request: Request): Promise<Response>;
}) {
	const app = new Hono();
	app.use("*", async (c, next) => {
		await next();
		c.header("cache-control", "private, no-store");
	});
	app.get("/health", (c) => c.json({ status: "ok" }));
	if (deps.objectStorageUnavailable) {
		// Stop before upload persistence/cleanup so existing resumable uploads survive.
		for (const path of [
			"/api/v1/media/*",
			"/api/v1/uploads",
			"/api/v1/uploads/*",
		]) {
			app.all(path, (c) => c.json({ error: { code: "NOT_FOUND" } }, 404));
		}
	}
	// OAuth stays on the Web origin. The BFF supplies only a validated public origin.
	function publicRequest(request: Request): Request | null {
		const origin =
			request.headers.get("x-s-private-web-origin") ?? deps.publicOrigin;
		if (!deps.isTrustedOrigin(origin)) return null;
		const url = new URL(request.url);
		const target = new URL(url.pathname + url.search, origin);
		const headers = new Headers(request.headers);
		for (const name of [
			"x-s-private-web-origin",
			"x-forwarded-host",
			"x-forwarded-proto",
			"forwarded",
		])
			headers.delete(name);
		headers.set("host", target.host);
		return new Request(target, new Request(request, { headers }));
	}
	app.get("/api/sign-in", (c) => {
		const request = publicRequest(c.req.raw);
		return request ? deps.signIn(request) : c.json({ error: "Forbidden" }, 403);
	});
	app.on(["GET", "POST"], "/api/auth/*", (c) => {
		const request = publicRequest(c.req.raw);
		return request ? deps.auth(request) : c.json({ error: "Forbidden" }, 403);
	});
	app.get("/api/cron/gigazine-headline", (c) => deps.cron(c.req.raw));
	app.all("/api/v1/*", (c) => deps.api(c.req.raw));
	app.onError(async (error, c) => {
		await deps.reportError(error);
		return c.json({ error: "Internal server error" }, 500);
	});
	return app;
}

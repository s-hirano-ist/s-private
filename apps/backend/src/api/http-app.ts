import { Hono, type MiddlewareHandler } from "hono";
import { publicOriginHeaders } from "s-private-backend/auth/public-origin-headers";
import {
	AuthInitializationError,
	AUTH_RETRY_AFTER_SECONDS,
} from "s-private-backend/auth/recoverable-auth";

export function createBackendHttpApp(deps: {
	api(request: Request): Response | Promise<Response>;
	auth(request: Request): Promise<Response>;
	cron(request: Request): Promise<Response>;
	isTrustedOrigin(origin: string): boolean;
	publicOrigin?: string;
	reportError(error: unknown): unknown;
	signIn(request: Request): Promise<Response>;
	telemetryMiddleware?: MiddlewareHandler;
}) {
	const app = new Hono();
	if (deps.telemetryMiddleware) app.use("*", deps.telemetryMiddleware);
	app.use("*", async (c, next) => {
		await next();
		c.header("cache-control", "private, no-store");
	});
	app.get("/health", (c) => c.json({ status: "ok" }));

	// OAuth stays on the Web origin. The BFF supplies only a validated public origin.
	function publicRequest(request: Request): Request | null {
		const origin =
			request.headers.get("x-s-private-web-origin") ?? deps.publicOrigin;
		if (!origin || !deps.isTrustedOrigin(origin)) return null;
		const url = new URL(request.url);
		const target = new URL(url.pathname + url.search, origin);
		const headers = publicOriginHeaders(request.headers, origin);
		return new Request(target, new Request(request, { headers }));
	}
	app.get("/api/sign-in", async (c) => {
		const request = publicRequest(c.req.raw);
		return request ? deps.signIn(request) : c.json({ error: "Forbidden" }, 403);
	});
	app.on(["GET", "POST"], "/api/auth/*", async (c) => {
		const request = publicRequest(c.req.raw);
		return request ? deps.auth(request) : c.json({ error: "Forbidden" }, 403);
	});
	app.get("/api/cron/gigazine-headline", (c) => deps.cron(c.req.raw));
	app.all("/api/v1/*", (c) => deps.api(c.req.raw));
	app.onError(async (error, c) => {
		if (error instanceof AuthInitializationError) {
			c.header("retry-after", String(AUTH_RETRY_AFTER_SECONDS));
			return c.json({ error: { code: "API_UNAVAILABLE" } }, 503);
		}
		await deps.reportError(error);
		return c.json({ error: "Internal server error" }, 500);
	});
	return app;
}

import type { MobileDeps } from "@s-hirano-ist/s-application/mobile/deps";
import type { Context } from "hono";
import type { McpConfig } from "s-private-backend/mcp/config";
import type { McpToolDeps } from "s-private-backend/mcp/tools";
import { createMcpHonoApp } from "@modelcontextprotocol/hono";
import {
	buildOAuthProtectedResourceMetadata,
	createMcpHandler,
	getOAuthProtectedResourceMetadataUrl,
	requireBearerAuth,
} from "@modelcontextprotocol/server";
import { observe } from "@s-hirano-ist/s-infrastructure/observability/operational-telemetry";
import { cors } from "hono/cors";
import { createMcpTokenVerifier, MCP_SCOPE } from "s-private-backend/mcp/auth";
import { createContentMcpServer } from "s-private-backend/mcp/tools";

export function createMcpApp(
	config: McpConfig,
	deps: McpToolDeps & { accounts: MobileDeps["accounts"] },
) {
	const app = createMcpHonoApp({
		host: "0.0.0.0",
		allowedHosts: [config.resource.hostname],
		// Exact scheme/port validation below is stricter than the SDK's hostname check.
		allowedOrigins: config.origins.map((origin) => new URL(origin).hostname),
		maxRequestBodySize: 64 * 1024,
	});
	app.use("*", async (c, next) => {
		c.header("cache-control", "private, no-store");
		const origin = c.req.header("origin");
		if (origin !== undefined && !config.origins.includes(origin))
			return c.json({ error: "Forbidden" }, 403);
		return next();
	});
	app.use(
		"*",
		cors({
			origin: (origin) =>
				config.origins.includes(origin) ? origin : undefined,
			allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
			allowHeaders: [
				"Authorization",
				"Content-Type",
				"MCP-Protocol-Version",
				"Mcp-Session-Id",
			],
			exposeHeaders: ["WWW-Authenticate", "MCP-Protocol-Version"],
		}),
	);
	const metadata = buildOAuthProtectedResourceMetadata({
		resourceServerUrl: config.resource,
		scopesSupported: [MCP_SCOPE],
		resourceName: "s-private content",
		// Only the resource document is served here. Clients discover AS metadata directly from Auth0.
		oauthMetadata: {
			issuer: config.issuer,
			authorization_endpoint: new URL("authorize", config.issuer).href,
			token_endpoint: new URL("oauth/token", config.issuer).href,
			response_types_supported: ["code"],
		},
	});
	const metadataPath = new URL(
		getOAuthProtectedResourceMetadataUrl(config.resource),
	).pathname;
	for (const path of [metadataPath, "/.well-known/oauth-protected-resource"]) {
		app.get(path, (c) => c.json(metadata));
		app.all(path, (c) => {
			c.header("allow", "GET, HEAD, OPTIONS");
			return c.body(null, 405);
		});
	}
	const gate = requireBearerAuth({
		verifier: createMcpTokenVerifier(config, deps.accounts),
		requiredScopes: [MCP_SCOPE],
		expectedResource: config.resource,
		resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(config.resource),
	});
	const handler = createMcpHandler(({ authInfo }) =>
		createContentMcpServer(authInfo, deps),
	);
	app.all("/mcp", async (c: Context) => {
		const auth = await gate(c.req.raw);
		if (auth instanceof Response) {
			if (auth.status >= 500)
				observe(() =>
					deps.reportError(new Error("MCP authentication unavailable")),
				);
			return auth;
		}
		return handler.fetch(c.req.raw, {
			authInfo: auth,
			parsedBody: c.get("parsedBody"),
		});
	});
	app.onError((_error, c) => {
		observe(() => deps.reportError(new Error("MCP request failed")));
		return c.json({ error: "server_error" }, 500);
	});
	return app;
}

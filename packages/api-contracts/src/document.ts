import { OpenAPIHono } from "@hono/zod-openapi";
import { apiRoutes } from "@s-hirano-ist/s-api-contracts/routes";
import { errorSchema } from "@s-hirano-ist/s-api-contracts/schemas";

/** Generates the contract without importing runtime adapters or connecting to services. */
export function createApiDocument(): ReturnType<
	OpenAPIHono["getOpenAPI31Document"]
> {
	const app = new OpenAPIHono();
	app.openAPIRegistry.register("ApiError", errorSchema);
	app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
		type: "http",
		scheme: "bearer",
		bearerFormat: "JWT",
	});
	app.openAPIRegistry.registerComponent("securitySchemes", "sessionCookie", {
		type: "apiKey",
		in: "cookie",
		name: "__Secure-better-auth.session_token",
	});
	for (const route of apiRoutes) app.openAPIRegistry.registerPath(route);
	return app.getOpenAPI31Document({
		openapi: "3.1.0",
		info: {
			title: "SPrivate Shared Backend API",
			version: "1.0.0",
			description:
				"Owner-scoped API shared by Web and iOS. Creation retries require the same operationId and canonical input.",
		},
		servers: [{ url: "/api/v1" }],
	});
}

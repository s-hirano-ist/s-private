import type { PushService } from "s-private-backend/api/push-service";
import type { ReadService } from "s-private-backend/api/read-service";
import type { ApiAuth, ApiEnvironment } from "s-private-backend/api/types";
import type { UploadService } from "s-private-backend/api/upload-service";
import type { WriteService } from "s-private-backend/api/write-service";
import { OpenAPIHono } from "@hono/zod-openapi";
import { registerContentRoutes } from "s-private-backend/api/content-routes";
import { apiErrorResponse } from "s-private-backend/api/error-handler";
import { registerApiMiddleware } from "s-private-backend/api/middleware";
import { registerReadRoutes } from "s-private-backend/api/read-routes";
import { registerUploadRoutes } from "s-private-backend/api/upload-routes";
import { registerWriteRoutes } from "s-private-backend/api/write-routes";
export function createApiApp(
	auth: ApiAuth,
	reads: ReadService,
	mutations: {
		push: PushService;
		uploads: UploadService;
		writes: WriteService;
	},
) {
	const app = new OpenAPIHono<ApiEnvironment>({
		defaultHook: (result, c) =>
			result.success
				? undefined
				: c.json({ error: { code: "VALIDATION_ERROR" as const } }, 422),
	}).basePath("/api/v1");
	registerApiMiddleware(app, auth);
	app.onError((error) =>
		apiErrorResponse(error, (cause) => auth.reportError(cause)),
	);
	app.notFound((c) => c.json({ error: { code: "NOT_FOUND" } }, 404));
	// Specific lookups must precede the shared /{id} routes.
	registerReadRoutes(app, reads);
	registerContentRoutes(app, reads, mutations.writes);
	registerWriteRoutes(app, mutations.writes, mutations.push);
	registerUploadRoutes(app, mutations.uploads);
	return app;
}

import type { ApiApp } from "s-private-backend/api/types";
import type { UploadService } from "s-private-backend/api/upload-service";
import * as routes from "@s-hirano-ist/s-api-contracts/routes";
import { responseBody } from "s-private-backend/api/response";
export function registerUploadRoutes(app: ApiApp, uploads: UploadService) {
	app.openapi(routes.startUploadRoute, async (c) =>
		c.json(
			responseBody(
				routes.startUploadRoute.responses[200].content["application/json"]
					.schema,
				await uploads.start(c.get("owner"), c.req.valid("json")),
			),
			200,
		),
	);
	app.openapi(routes.getUploadRoute, async (c) =>
		c.json(
			responseBody(
				routes.getUploadRoute.responses[200].content["application/json"].schema,
				await uploads.get(c.get("owner"), c.req.valid("param").id),
			),
			200,
		),
	);
	app.openapi(routes.putChunkRoute, async (c) => {
		const { id, part } = c.req.valid("param");
		return c.json(
			responseBody(
				routes.putChunkRoute.responses[200].content["application/json"].schema,
				await uploads.put(
					c.get("owner"),
					id,
					part,
					new Uint8Array(await c.req.arrayBuffer()),
				),
			),
			200,
		);
	});
	app.openapi(routes.completeUploadRoute, async (c) =>
		c.json(
			responseBody(
				routes.completeUploadRoute.responses[201].content["application/json"]
					.schema,
				await uploads.complete(c.get("owner"), c.req.valid("param").id),
			),
			201,
		),
	);
	app.openapi(routes.cancelUploadRoute, async (c) => {
		await uploads.cancel(c.get("owner"), c.req.valid("param").id);
		return c.body(null, 204);
	});
}

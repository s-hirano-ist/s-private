import type { PushService } from "s-private-backend/api/push-service";
import type { ApiApp } from "s-private-backend/api/types";
import type { WriteService } from "s-private-backend/api/write-service";
import * as routes from "@s-hirano-ist/s-api-contracts/routes";
import { jsonResponse } from "s-private-backend/api/response";
export function registerWriteRoutes(
	app: ApiApp,
	writes: WriteService,
	push: PushService,
) {
	app.openapi(routes.createArticleRoute, async (c) =>
		jsonResponse(
			c,
			routes.createArticleRoute.responses[201].content["application/json"]
				.schema,
			await writes.article(c.get("owner"), c.req.valid("json")),
			201,
		),
	);
	app.openapi(routes.createNoteRoute, async (c) =>
		jsonResponse(
			c,
			routes.createNoteRoute.responses[201].content["application/json"].schema,
			await writes.note(c.get("owner"), c.req.valid("json")),
			201,
		),
	);
	app.openapi(routes.pushStatusRoute, async (c) =>
		jsonResponse(
			c,
			routes.pushStatusRoute.responses[200].content["application/json"].schema,
			await push.status(c.get("owner"), c.req.valid("json").endpoint),
			200,
		),
	);
	app.openapi(routes.subscribeRoute, async (c) => {
		await push.subscribe(c.get("owner"), c.req.valid("json"));
		return c.body(null, 204);
	});
	app.openapi(routes.unsubscribeRoute, async (c) => {
		await push.unsubscribe(c.get("owner"), c.req.valid("json").endpoint);
		return c.body(null, 204);
	});
	app.openapi(routes.testPushRoute, async (c) => {
		await push.test(c.get("owner"), c.req.valid("json").endpoint);
		return c.body(null, 204);
	});
}

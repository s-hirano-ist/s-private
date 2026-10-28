import type { PushService } from "s-private-backend/api/push-service";
import type { ApiApp } from "s-private-backend/api/types";
import type { WriteService } from "s-private-backend/api/write-service";
import * as routes from "@s-hirano-ist/s-api-contracts/routes";
import { responseBody } from "s-private-backend/api/response";
export function registerWriteRoutes(
	app: ApiApp,
	writes: WriteService,
	push: PushService,
) {
	app.openapi(routes.createArticleRoute, async (c) =>
		c.json(
			responseBody(
				routes.createArticleRoute.responses[201].content["application/json"]
					.schema,
				await writes.article(c.get("owner"), c.req.valid("json")),
			),
			201,
		),
	);
	app.openapi(routes.createNoteRoute, async (c) =>
		c.json(
			responseBody(
				routes.createNoteRoute.responses[201].content["application/json"]
					.schema,
				await writes.note(c.get("owner"), c.req.valid("json")),
			),
			201,
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

import type { RssService } from "@s-hirano-ist/s-application/rss/service";
import type { ApiApp } from "s-private-backend/api/types";
import * as routes from "@s-hirano-ist/s-api-contracts/routes";
import * as schemas from "@s-hirano-ist/s-api-contracts/schemas";
import { parseRssImport } from "@s-hirano-ist/s-infrastructure/rss/import";
import { jsonResponse } from "s-private-backend/api/response";
export function registerRssRoutes(app: ApiApp, rss: RssService) {
	app.openapi(routes.rssPageRoute, async (c) => {
		const query = c.req.valid("query");
		return jsonResponse(
			c,
			schemas.rssPageSchema,
			await rss.page(c.get("owner"), query.offset, query.feedId, query.view),
			200,
		);
	});
	app.openapi(routes.rssSubscribeRoute, async (c) =>
		jsonResponse(
			c,
			schemas.rssAddedSchema,
			{ added: await rss.subscribe(c.get("owner"), c.req.valid("json")) },
			200,
		),
	);
	app.openapi(routes.rssUnsubscribeRoute, async (c) => {
		await rss.unsubscribe(c.get("owner"), c.req.valid("param").id);
		return c.body(null, 204);
	});
	app.openapi(routes.rssReadRoute, async (c) => {
		await rss.read(c.get("owner"), c.req.valid("json"));
		return c.body(null, 204);
	});
	app.openapi(routes.rssSaveRoute, async (c) =>
		jsonResponse(
			c,
			schemas.rssAddedSchema,
			{ added: await rss.save(c.get("owner"), c.req.valid("json")) },
			200,
		),
	);
	app.openapi(routes.rssUnsaveRoute, async (c) => {
		await rss.unsave(c.get("owner"), c.req.valid("param").id);
		return c.body(null, 204);
	});
	app.openapi(routes.rssRefreshRoute, async (c) => {
		const { ids, force } = c.req.valid("json");
		return jsonResponse(
			c,
			schemas.rssRefreshResultSchema,
			{ data: await rss.refresh(c.get("owner"), ids, force) },
			200,
		);
	});
	app.openapi(routes.rssImportRoute, async (c) => {
		const { kind, content } = c.req.valid("json");
		return jsonResponse(
			c,
			schemas.rssImportResultSchema,
			await rss.import(c.get("owner"), parseRssImport(kind, content)),
			200,
		);
	});
}

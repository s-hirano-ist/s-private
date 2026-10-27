import type { ReadService } from "s-private-backend/api/read-service";
import type { ApiApp } from "s-private-backend/api/types";
import * as routes from "@s-hirano-ist/s-api-contracts/routes";
import { ApiError } from "s-private-backend/api/error";
import { responseBody } from "s-private-backend/api/response";
export function registerReadRoutes(app: ApiApp, reads: ReadService) {
	app.openapi(routes.bookByIsbnRoute, async (c) =>
		c.json(
			responseBody(
				routes.bookByIsbnRoute.responses[200].content["application/json"]
					.schema,
				await reads.lookup("books", c.get("owner"), c.req.valid("param").isbn),
			),
			200,
		),
	);
	app.openapi(routes.noteByTitleRoute, async (c) =>
		c.json(
			responseBody(
				routes.noteByTitleRoute.responses[200].content["application/json"]
					.schema,
				await reads.lookup("notes", c.get("owner"), c.req.valid("param").title),
			),
			200,
		),
	);
	app.openapi(routes.categoriesRoute, async (c) =>
		c.json(
			responseBody(
				routes.categoriesRoute.responses[200].content["application/json"]
					.schema,
				{ data: await reads.categories(c.get("owner")) },
			),
			200,
		),
	);
	app.openapi(routes.syncHeadRoute, async (c) =>
		c.json(
			responseBody(
				routes.syncHeadRoute.responses[200].content["application/json"].schema,
				await reads.head(c.get("owner")),
			),
			200,
		),
	);
	app.openapi(routes.syncSnapshotRoute, async (c) =>
		c.json(
			responseBody(
				routes.syncSnapshotRoute.responses[200].content["application/json"]
					.schema,
				await reads.snapshot(c.get("owner"), c.req.valid("query")),
			),
			200,
		),
	);
	app.openapi(routes.syncChangesRoute, async (c) =>
		c.json(
			responseBody(
				routes.syncChangesRoute.responses[200].content["application/json"]
					.schema,
				await reads.changes(c.get("owner"), c.req.valid("query")),
			),
			200,
		),
	);
	app.openapi(routes.searchRoute, async (c) =>
		c.json(
			responseBody(
				routes.searchRoute.responses[200].content["application/json"].schema,
				await reads.search(c.get("owner"), c.req.valid("query")),
			),
			200,
		),
	);
	app.openapi(routes.mediaRoute, async (c) => {
		const { domain, id, variant } = c.req.valid("param");
		return reads.media(c.get("owner"), domain, id, variant);
	});
	app.openapi(routes.sessionRoute, (c) => {
		const session = c.get("session");
		if (!session) throw new ApiError("UNAUTHORIZED");
		return c.json(
			responseBody(
				routes.sessionRoute.responses[200].content["application/json"].schema,
				session,
			),
			200,
		);
	});
}

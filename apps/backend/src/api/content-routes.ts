import type { DtoByDomain } from "s-private-backend/api/read-models";
import type { ReadService } from "s-private-backend/api/read-service";
import type { ApiApp } from "s-private-backend/api/types";
import type { WriteService } from "s-private-backend/api/write-service";
import type { MobileDomain } from "s-private-backend/mobile/models";
import type { ZodType } from "zod";
import * as routes from "@s-hirano-ist/s-api-contracts/routes";
import * as schemas from "@s-hirano-ist/s-api-contracts/schemas";
import { responseBody } from "s-private-backend/api/response";

export function registerContentDomain<D extends MobileDomain>(
	app: ApiApp,
	domain: D,
	record: ZodType<DtoByDomain[NoInfer<D>]>,
	reads: ReadService,
	writes: WriteService,
) {
	const contract = routes.contentRoutes(domain, record);
	app.openapi(contract.list, async (c) =>
		c.json(
			responseBody(
				contract.list.responses[200].content["application/json"].schema,
				await reads.page(domain, c.get("owner"), c.req.valid("query")),
			),
			200,
		),
	);
	app.openapi(contract.count, async (c) =>
		c.json(
			responseBody(
				contract.count.responses[200].content["application/json"].schema,
				await reads.count(domain, c.get("owner"), c.req.valid("query")),
			),
			200,
		),
	);
	app.openapi(contract.detail, async (c) =>
		c.json(
			responseBody(
				contract.detail.responses[200].content["application/json"].schema,
				await reads.detail(domain, c.get("owner"), c.req.valid("param").id),
			),
			200,
		),
	);
	app.openapi(contract.delete, async (c) => {
		await writes.remove(c.get("owner"), domain, c.req.valid("param").id);
		return c.body(null, 204);
	});
}
export function registerContentRoutes(
	app: ApiApp,
	reads: ReadService,
	writes: WriteService,
) {
	registerContentDomain(app, "articles", schemas.articleSchema, reads, writes);
	registerContentDomain(app, "notes", schemas.noteSchema, reads, writes);
	registerContentDomain(app, "images", schemas.imageSchema, reads, writes);
	registerContentDomain(app, "books", schemas.bookSchema, reads, writes);
}

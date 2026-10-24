import type { ReadService } from "@s-hirano-ist/s-backend/api/read-service";
import type { z } from "zod";
import { OpenAPIHono } from "@hono/zod-openapi";
import * as routes from "@s-hirano-ist/s-api-contracts/routes";
import * as schemas from "@s-hirano-ist/s-api-contracts/schemas";
import { MobileApiError } from "@s-hirano-ist/s-backend/mobile/error";
import { tenantContext } from "@s-hirano-ist/s-backend/shared/tenant-context";

export type ApiSession = z.output<typeof schemas.sessionSchema>;
export type ApiAuth = {
	authenticateBearer(request: Request): Promise<string>;
	getWebSession(
		headers: Headers,
	): Promise<{ headers?: Headers; session: ApiSession | null }>;
	isTrustedOrigin(origin: string): boolean;
	reportError(error: unknown): void;
};
export type ApiEnvironment = {
	Variables: { owner: string; session: ApiSession | null };
};
export function createApiApp(auth: ApiAuth, reads: ReadService) {
	const app = new OpenAPIHono<ApiEnvironment>({
		defaultHook: (result, c) =>
			result.success
				? undefined
				: c.json({ error: { code: "VALIDATION_ERROR" as const } }, 422),
	}).basePath("/api/v1");
	app.use("*", async (c, next) => {
		c.header("cache-control", "private, no-store");
		const authorization = c.req.header("authorization");
		let session: ApiSession | null = null;
		let responseHeaders: Headers | undefined;
		let owner: string;
		if (authorization === undefined) {
			const result = await auth.getWebSession(c.req.raw.headers);
			if (!result.session) throw new MobileApiError("UNAUTHORIZED", 401);
			session = schemas.sessionSchema.parse(result.session);
			responseHeaders = result.headers;
			owner = session.user.id;
			if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
				const origin = c.req.header("origin");
				if (!origin || !auth.isTrustedOrigin(origin))
					throw new MobileApiError("FORBIDDEN", 403);
			}
		} else {
			owner = await auth.authenticateBearer(c.req.raw);
		}
		c.set("owner", owner);
		c.set("session", session);
		await tenantContext.run({ userId: owner }, () => next());
		for (const cookie of responseHeaders?.getSetCookie() ?? [])
			c.header("set-cookie", cookie, { append: true });
	});
	app.onError((error) => {
		let code = "INTERNAL_ERROR";
		if (error instanceof MobileApiError) code = error.code;
		if (code === "MOBILE_API_UNAVAILABLE") code = "API_UNAVAILABLE";
		const parsed = schemas.errorSchema.safeParse({ error: { code } });
		const status =
			error instanceof MobileApiError &&
			[401, 403, 404, 409, 410, 413, 422, 503].includes(error.status) &&
			parsed.success
				? error.status
				: 500;
		if (status === 500) auth.reportError(error);
		return Response.json(
			parsed.success && status !== 500
				? parsed.data
				: { error: { code: "INTERNAL_ERROR" } },
			{ status, headers: { "cache-control": "private, no-store" } },
		);
	});
	app.notFound((c) => c.json({ error: { code: "NOT_FOUND" } }, 404));
	app.openapi(routes.bookByIsbnRoute, async (c) =>
		c.json(
			schemas.bookSchema.parse(
				await reads.lookup("books", c.get("owner"), c.req.valid("param").isbn),
			),
			200,
		),
	);
	app.openapi(routes.noteByTitleRoute, async (c) =>
		c.json(
			schemas.noteSchema.parse(
				await reads.lookup("notes", c.get("owner"), c.req.valid("param").title),
			),
			200,
		),
	);
	app.openapi(routes.articlesRoutes.list, async (c) =>
		c.json(
			routes.articlesRoutes.list.responses[200].content[
				"application/json"
			].schema.parse(
				await reads.page("articles", c.get("owner"), c.req.valid("query")),
			),
			200,
		),
	);
	app.openapi(routes.articlesRoutes.count, async (c) =>
		c.json(
			await reads.count("articles", c.get("owner"), c.req.valid("query")),
			200,
		),
	);
	app.openapi(routes.articlesRoutes.detail, async (c) =>
		c.json(
			schemas.articleSchema.parse(
				await reads.detail("articles", c.get("owner"), c.req.valid("param").id),
			),
			200,
		),
	);
	app.openapi(routes.notesRoutes.list, async (c) =>
		c.json(
			routes.notesRoutes.list.responses[200].content[
				"application/json"
			].schema.parse(
				await reads.page("notes", c.get("owner"), c.req.valid("query")),
			),
			200,
		),
	);
	app.openapi(routes.notesRoutes.count, async (c) =>
		c.json(
			await reads.count("notes", c.get("owner"), c.req.valid("query")),
			200,
		),
	);
	app.openapi(routes.notesRoutes.detail, async (c) =>
		c.json(
			schemas.noteSchema.parse(
				await reads.detail("notes", c.get("owner"), c.req.valid("param").id),
			),
			200,
		),
	);
	app.openapi(routes.imagesRoutes.list, async (c) =>
		c.json(
			routes.imagesRoutes.list.responses[200].content[
				"application/json"
			].schema.parse(
				await reads.page("images", c.get("owner"), c.req.valid("query")),
			),
			200,
		),
	);
	app.openapi(routes.imagesRoutes.count, async (c) =>
		c.json(
			await reads.count("images", c.get("owner"), c.req.valid("query")),
			200,
		),
	);
	app.openapi(routes.imagesRoutes.detail, async (c) =>
		c.json(
			schemas.imageSchema.parse(
				await reads.detail("images", c.get("owner"), c.req.valid("param").id),
			),
			200,
		),
	);
	app.openapi(routes.booksRoutes.list, async (c) =>
		c.json(
			routes.booksRoutes.list.responses[200].content[
				"application/json"
			].schema.parse(
				await reads.page("books", c.get("owner"), c.req.valid("query")),
			),
			200,
		),
	);
	app.openapi(routes.booksRoutes.count, async (c) =>
		c.json(
			await reads.count("books", c.get("owner"), c.req.valid("query")),
			200,
		),
	);
	app.openapi(routes.booksRoutes.detail, async (c) =>
		c.json(
			schemas.bookSchema.parse(
				await reads.detail("books", c.get("owner"), c.req.valid("param").id),
			),
			200,
		),
	);
	app.openapi(routes.categoriesRoute, async (c) =>
		c.json({ data: await reads.categories(c.get("owner")) }, 200),
	);
	app.openapi(routes.syncHeadRoute, async (c) =>
		c.json(await reads.head(c.get("owner")), 200),
	);
	app.openapi(routes.syncSnapshotRoute, async (c) =>
		c.json(await reads.snapshot(c.get("owner"), c.req.valid("query")), 200),
	);
	app.openapi(routes.syncChangesRoute, async (c) =>
		c.json(await reads.changes(c.get("owner"), c.req.valid("query")), 200),
	);
	app.openapi(routes.searchRoute, async (c) =>
		c.json(await reads.search(c.get("owner"), c.req.valid("query")), 200),
	);
	app.openapi(routes.mediaRoute, async (c) => {
		const { domain, id, variant } = c.req.valid("param");
		return reads.media(c.get("owner"), domain, id, variant);
	});
	app.openapi(routes.sessionRoute, (c) => {
		const session = c.get("session");
		if (!session) throw new MobileApiError("UNAUTHORIZED", 401);
		return c.json(session, 200);
	});
	return app;
}

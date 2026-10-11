import type { mobileControllers } from "@/backend/http/mobile/controllers";
import type { Handler } from "hono";
import { Hono } from "hono";

type MobileControllers = typeof mobileControllers;

function methodFallback(methods: readonly string[]): Handler {
	const allow = [
		...methods,
		...(methods.includes("GET") ? ["HEAD"] : []),
		"OPTIONS",
	].join(", ");
	return (context) =>
		new Response(null, {
			status: context.req.method === "OPTIONS" ? 204 : 405,
			headers: { Allow: allow, "Cache-Control": "no-store" },
		});
}

/** Transitional router: preserve the mobile wire format while removing Next.js controllers. */
export function createMobileApp(controllers: MobileControllers) {
	const app = new Hono().basePath("/api/mobile/v1");
	app.use("*", async (context, next) => {
		await next();
		if (!context.res.headers.has("Cache-Control"))
			context.header("Cache-Control", "no-store");
	});
	app.onError(() =>
		Response.json(
			{ error: { code: "INTERNAL_ERROR" } },
			{
				status: 500,
				headers: { "Cache-Control": "no-store" },
			},
		),
	);
	app.notFound((context) =>
		context.json({ error: { code: "NOT_FOUND" } }, 404),
	);

	// Static routes precede content parameters, including their method fallback.
	app.get("/categories", (context) =>
		controllers.categories.GET(context.req.raw),
	);
	app.all("/categories", methodFallback(["GET"]));
	app.get("/manifest", (context) => controllers.manifest.GET(context.req.raw));
	app.all("/manifest", methodFallback(["GET"]));
	app.get("/search", (context) => controllers.search.GET(context.req.raw));
	app.all("/search", methodFallback(["GET"]));
	app.get("/sync/head", (context) => controllers.syncHead.GET(context.req.raw));
	app.all("/sync/head", methodFallback(["GET"]));
	app.get("/sync/snapshot", (context) =>
		controllers.syncSnapshot.GET(context.req.raw),
	);
	app.all("/sync/snapshot", methodFallback(["GET"]));
	app.get("/sync/changes", (context) =>
		controllers.syncChanges.GET(context.req.raw),
	);
	app.all("/sync/changes", methodFallback(["GET"]));
	app.post("/uploads", (context) => controllers.uploads.POST(context.req.raw));
	app.all("/uploads", methodFallback(["POST"]));
	app.get("/uploads/:id", (context) =>
		controllers.upload.GET(context.req.raw, context.req.param()),
	);
	app.delete("/uploads/:id", (context) =>
		controllers.upload.DELETE(context.req.raw, context.req.param()),
	);
	app.all("/uploads/:id", methodFallback(["GET", "DELETE"]));
	app.put("/uploads/:id/chunks/:part", (context) =>
		controllers.uploadChunk.PUT(context.req.raw, context.req.param()),
	);
	app.all("/uploads/:id/chunks/:part", methodFallback(["PUT"]));
	app.post("/uploads/:id/complete", (context) =>
		controllers.uploadComplete.POST(context.req.raw, context.req.param()),
	);
	app.all("/uploads/:id/complete", methodFallback(["POST"]));
	app.get("/media/:domain/:id/:variant", (context) =>
		controllers.media.GET(context.req.raw, context.req.param()),
	);
	app.all("/media/:domain/:id/:variant", methodFallback(["GET"]));
	app.get("/:domain", (context) =>
		controllers.content.GET(context.req.raw, context.req.param()),
	);
	app.post("/:domain", (context) =>
		controllers.content.POST(context.req.raw, context.req.param()),
	);
	app.all("/:domain", methodFallback(["GET", "POST"]));
	app.get("/:domain/:id", (context) =>
		controllers.detail.GET(context.req.raw, context.req.param()),
	);
	app.delete("/:domain/:id", (context) =>
		controllers.detail.DELETE(context.req.raw, context.req.param()),
	);
	app.all("/:domain/:id", methodFallback(["GET", "DELETE"]));
	return app;
}

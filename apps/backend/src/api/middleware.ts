import type { ApiApp, ApiAuth, ApiSession } from "s-private-backend/api/types";
import * as schemas from "@s-hirano-ist/s-api-contracts/schemas";
import { bodyLimit } from "hono/body-limit";
import { ApiError } from "s-private-backend/api/error";
import { tenantContext } from "s-private-backend/shared/tenant-context";
export function registerApiMiddleware(app: ApiApp, auth: ApiAuth) {
	app.use("*", async (c, next) => {
		c.header("cache-control", "private, no-store");
		const authorization = c.req.header("authorization");
		let session: ApiSession | null = null;
		let responseHeaders: Headers | undefined;
		let owner: string;
		if (authorization === undefined) {
			const result = await auth.getWebSession(c.req.raw.headers);
			if (!result.session) throw new ApiError("UNAUTHORIZED");
			session = schemas.sessionSchema.parse(result.session);
			responseHeaders = result.headers;
			owner = session.user.id;
			if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
				const origin = c.req.header("origin");
				if (!origin || !auth.isTrustedOrigin(origin))
					throw new ApiError("FORBIDDEN");
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

	const jsonLimit = bodyLimit({
		maxSize: 4 * 1024 * 1024,
		onError: () => {
			throw new ApiError("UPLOAD_TOO_LARGE");
		},
	});
	app.on(
		"POST",
		["/articles", "/notes", "/uploads", "/push/subscriptions", "/push/test"],
		jsonLimit,
	);
	app.on("DELETE", "/push/subscriptions", jsonLimit);
	app.on(
		"PUT",
		"/uploads/:id/chunks/:part",
		bodyLimit({
			maxSize: schemas.uploadChunkSize,
			onError: () => {
				throw new ApiError("UPLOAD_TOO_LARGE");
			},
		}),
	);
}

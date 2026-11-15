import { createMediaCleanupCron } from "s-private-backend/content/cleanup-cron";
import { expect, test, vi } from "vitest";
test("cleanup is disabled or authenticated before any global DB access", async () => {
	const drain = vi.fn(async () => ({ processed: 2 }));
	const request = new Request(
		"https://backend.example/api/cron/media-cleanup",
		{ headers: { authorization: "Bearer secret" } },
	);
	expect(
		(
			await createMediaCleanupCron(
				{ BACKEND_CRON_ENABLED: false, CRON_SECRET: "secret" },
				drain,
			)(request)
		).status,
	).toBe(404);
	const handler = createMediaCleanupCron(
		{ BACKEND_CRON_ENABLED: true, CRON_SECRET: "secret" },
		drain,
	);
	expect((await handler(new Request(request.url))).status).toBe(401);
	expect(drain).not.toHaveBeenCalled();
	expect(await (await handler(request)).json()).toEqual({ processed: 2 });
	expect(drain).toHaveBeenCalledOnce();
});

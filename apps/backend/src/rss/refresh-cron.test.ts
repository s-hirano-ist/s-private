import { createRssRefreshCron } from "s-private-backend/rss/refresh-cron";
import { expect, test, vi } from "vitest";
const config = { BACKEND_CRON_ENABLED: true, CRON_SECRET: "secret" };
const request = () =>
	new Request("https://backend.example/api/cron/rss-refresh", {
		headers: { authorization: "Bearer secret" },
	});
function fixture() {
	return {
		due: vi.fn().mockResolvedValue([]),
		refresh: vi.fn().mockResolvedValue([{ id: "feed", status: "updated" }]),
		report: vi.fn(),
		completed: vi.fn(),
	};
}
test("authenticates and checks enablement before global subscription access", async () => {
	const deps = fixture();
	expect(
		(
			await createRssRefreshCron(
				{ ...config, BACKEND_CRON_ENABLED: false },
				deps,
			)(request())
		).status,
	).toBe(404);
	expect(
		(await createRssRefreshCron(config, deps)(new Request(request().url)))
			.status,
	).toBe(401);
	expect(
		(
			await createRssRefreshCron(
				{ ...config, CRON_SECRET: undefined },
				deps,
			)(request())
		).status,
	).toBe(401);
	expect(deps.due).not.toHaveBeenCalled();
	expect(
		await (await createRssRefreshCron(config, deps)(request())).json(),
	).toEqual({ processed: 0, updated: 0, failed: 0, skipped: 0, deferred: 0 });
	expect(deps.due).toHaveBeenCalledWith(expect.any(Date), 100);
});
test("keeps five slots busy and isolates owners while continuing after failures", async () => {
	const deps = fixture();
	const slow = Promise.withResolvers<undefined>();
	deps.due.mockResolvedValue(
		Array.from({ length: 8 }, (_, i) => ({
			id: String(i),
			userId: `owner-${i}`,
		})),
	);
	let active = 0;
	let peak = 0;
	const outcome = vi
		.fn(
			async (
				id: string,
			): Promise<
				{ id: string; status: "updated" | "failed" | "skipped" }[]
			> => [{ id, status: "updated" }],
		)
		.mockImplementationOnce(async (id) => {
			await slow.promise;
			return [{ id, status: "updated" as const }];
		})
		.mockRejectedValueOnce(new Error("claim failed"))
		.mockResolvedValueOnce([{ id: "2", status: "failed" }])
		.mockResolvedValueOnce([{ id: "3", status: "skipped" }]);
	deps.refresh.mockImplementation(async (owner: string, id: string) => {
		expect(owner).toBe(`owner-${id}`);
		peak = Math.max(peak, ++active);
		try {
			return await outcome(id);
		} finally {
			active--;
		}
	});
	deps.report.mockRejectedValue(new Error("reporter unavailable"));
	const pending = createRssRefreshCron(config, deps)(request());
	await vi.waitFor(() => expect(deps.refresh).toHaveBeenCalledTimes(8));
	expect(peak).toBe(5);
	expect(active).toBe(1);
	slow.resolve(undefined);
	expect(await (await pending).json()).toEqual({
		processed: 8,
		updated: 5,
		failed: 2,
		skipped: 1,
		deferred: 0,
	});
});
test("stops starting feeds with 30 seconds left and leaves unprocessed feeds for the next invocation", async () => {
	const deps = fixture();
	let now = 0;
	deps.due.mockResolvedValue(
		Array.from({ length: 10 }, (_, i) => ({ id: String(i), userId: "owner" })),
	);
	deps.refresh.mockImplementation(async () => {
		now = 211000;
		return [{ id: "feed", status: "updated" }];
	});
	const response = await createRssRefreshCron(config, {
		...deps,
		now: () => now,
	})(request());
	expect(await response.json()).toMatchObject({ processed: 1, deferred: 9 });
});

import { beforeEach, describe, expect, test, vi } from "vite-plus/test";

const { sendPushToAll } = vi.hoisted(() => ({ sendPushToAll: vi.fn() }));

import { createGigazineCronHandler } from "s-private-backend/notifications/cron";
const reportCritical = vi.fn();
const GET = createGigazineCronHandler(
	{ CRON_SECRET: "test-cron-secret-value" },
	sendPushToAll,
	reportCritical,
);

const createRequest = (secret?: string) =>
	new Request("https://example.com/api/cron/gigazine-headline", {
		headers: secret ? { authorization: `Bearer ${secret}` } : undefined,
	});

beforeEach(() => {
	vi.clearAllMocks();
	sendPushToAll.mockResolvedValue({
		requiresResubscribe: 0,
		expired: 0,
		failed: 0,
		sent: 2,
	});
});

describe("GET /api/cron/gigazine-headline", () => {
	test.each([undefined, "wrong-secret"])(
		"rejects an invalid bearer token",
		async (secret) => {
			const response = await GET(createRequest(secret));
			expect(response.status).toBe(401);
			expect(sendPushToAll).not.toHaveBeenCalled();
		},
	);

	test("returns delivery counts", async () => {
		const response = await GET(createRequest("test-cron-secret-value"));
		const body = await response.json();
		expect(response.status).toBe(200);
		expect(body).toMatchObject({
			requiresResubscribe: 0,
			expired: 0,
			failed: 0,
			sent: 2,
		});
		expect(sendPushToAll).toHaveBeenCalledOnce();
	});

	test("returns 500 when a transient delivery fails", async () => {
		sendPushToAll.mockResolvedValue({
			requiresResubscribe: 0,
			expired: 1,
			failed: 1,
			sent: 1,
		});
		const response = await GET(createRequest("test-cron-secret-value"));
		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({
			requiresResubscribe: 0,
			expired: 1,
			failed: 1,
			sent: 1,
		});
	});
});

test("returns 200 for quarantined subscriptions without other delivery failures", async () => {
	sendPushToAll.mockResolvedValue({
		requiresResubscribe: 1,
		expired: 0,
		failed: 0,
		sent: 0,
	});
	const response = await GET(createRequest("test-cron-secret-value"));
	expect(response.status).toBe(200);
	expect(reportCritical).not.toHaveBeenCalled();
	expect(await response.json()).toMatchObject({
		requiresResubscribe: 1,
		failed: 0,
	});
});

test("reports a whole batch failure once as critical", async () => {
	const error = new Error("batch unavailable");
	sendPushToAll.mockRejectedValueOnce(error);
	const response = await GET(createRequest("test-cron-secret-value"));
	expect(response.status).toBe(500);
	expect(reportCritical).toHaveBeenCalledExactlyOnceWith(error);
});

test("pages when all transient deliveries fail", async () => {
	sendPushToAll.mockResolvedValueOnce({
		requiresResubscribe: 0,
		expired: 0,
		failed: 2,
		sent: 0,
	});
	const response = await GET(createRequest("test-cron-secret-value"));
	expect(response.status).toBe(500);
	expect(reportCritical).toHaveBeenCalledOnce();
});

describe("Cron monitoring", () => {
	const captureCheckIn = vi.fn(() => "check-in-id");
	const flush = vi.fn(async () => true);
	const telemetry = { log: vi.fn(), count: vi.fn(), duration: vi.fn() };
	const monitoring = { enabled: true, captureCheckIn, flush, telemetry };
	const handler = () =>
		createGigazineCronHandler(
			{ CRON_SECRET: "test-cron-secret-value" },
			sendPushToAll,
			reportCritical,
			monitoring,
		);
	test.each([
		[0, "ok"],
		[1, "error"],
	] as const)(
		"completes check-ins using the HTTP outcome (failed=%s)",
		async (failed, outcome) => {
			sendPushToAll.mockResolvedValue({
				sent: 1,
				failed,
				expired: 0,
				requiresResubscribe: 0,
			});
			await handler()(createRequest("test-cron-secret-value"));
			expect(captureCheckIn).toHaveBeenNthCalledWith(
				1,
				{ monitorSlug: "gigazine-headline", status: "in_progress" },
				expect.objectContaining({
					schedule: { type: "crontab", value: "0 0 * * *" },
					timezone: "UTC",
					checkinMargin: 60,
					maxRuntime: 10,
				}),
			);
			expect(captureCheckIn).toHaveBeenLastCalledWith({
				checkInId: "check-in-id",
				monitorSlug: "gigazine-headline",
				status: outcome,
			});
			expect(telemetry.count).toHaveBeenCalledWith("cron.deliveries", failed, {
				job: "gigazine-headline",
				status: "failed",
			});
		},
	);
	test("records exceptions as failed check-ins", async () => {
		sendPushToAll.mockRejectedValueOnce(new Error("offline"));
		expect(
			(await handler()(createRequest("test-cron-secret-value"))).status,
		).toBe(500);
		expect(captureCheckIn).toHaveBeenLastCalledWith(
			expect.objectContaining({ status: "error" }),
		);
	});
	test("does not check in on unauthorized or disabled requests", async () => {
		await handler()(createRequest());
		expect(captureCheckIn).not.toHaveBeenCalled();
		await createGigazineCronHandler(
			{ CRON_SECRET: "test-cron-secret-value" },
			sendPushToAll,
			reportCritical,
			{ ...monitoring, enabled: false },
		)(createRequest("test-cron-secret-value"));
		expect(captureCheckIn).not.toHaveBeenCalled();
		expect(telemetry.count).not.toHaveBeenCalled();
	});
	test("check-in and flush failures do not affect delivery", async () => {
		captureCheckIn.mockImplementationOnce(() => {
			throw new Error("offline");
		});
		flush.mockRejectedValueOnce(new Error("offline"));
		expect(
			(await handler()(createRequest("test-cron-secret-value"))).status,
		).toBe(200);
	});
});

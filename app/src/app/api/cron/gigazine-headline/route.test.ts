import { beforeEach, describe, expect, test, vi } from "vitest";

const { sendPushToAll } = vi.hoisted(() => ({ sendPushToAll: vi.fn() }));

vi.mock(
	"@/application-services/push-notifications/push-notification-service",
	() => ({
		sendPushToAll,
	}),
);

import { GET } from "./route";

const createRequest = (secret?: string) =>
	new Request("https://example.com/api/cron/gigazine-headline", {
		headers: secret ? { authorization: `Bearer ${secret}` } : undefined,
	});

describe("GET /api/cron/gigazine-headline", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		sendPushToAll.mockResolvedValue({ expired: 0, failed: 0, sent: 2 });
	});

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
		expect(body).toMatchObject({ expired: 0, failed: 0, sent: 2 });
		expect(sendPushToAll).toHaveBeenCalledOnce();
	});

	test("returns 500 when a transient delivery fails", async () => {
		sendPushToAll.mockResolvedValue({ expired: 1, failed: 1, sent: 1 });
		const response = await GET(createRequest("test-cron-secret-value"));
		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({
			expired: 1,
			failed: 1,
			sent: 1,
		});
	});
});

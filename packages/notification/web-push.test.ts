import { beforeEach, describe, expect, test, vi } from "vitest";

const { sendNotification, setVapidDetails } = vi.hoisted(() => ({
	sendNotification: vi.fn(),
	setVapidDetails: vi.fn(),
}));

vi.mock("web-push", () => ({
	default: { sendNotification, setVapidDetails },
}));

import {
	createWebPushService,
	WebPushSendError,
	type WebPushPayload,
} from "./web-push.js";

const config = {
	privateKey: "private",
	publicKey: "public",
	subject: "mailto:test@example.com",
};
const subscription = {
	auth: "auth",
	endpoint: "https://push.example.com/subscription",
	p256dh: "p256dh",
};
const payload: WebPushPayload = {
	body: "body",
	icon: "/apple-icon.png",
	tag: "tag",
	title: "title",
	url: "https://gigazine.net/news/20260918-headline",
};

describe("createWebPushService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		sendNotification.mockResolvedValue({ statusCode: 201 });
	});

	test("configures VAPID and sends a serialized payload", async () => {
		const service = createWebPushService(config);
		await service.send(subscription, payload);

		expect(setVapidDetails).toHaveBeenCalledWith(
			config.subject,
			config.publicKey,
			config.privateKey,
		);
		expect(sendNotification).toHaveBeenCalledWith(
			{
				endpoint: subscription.endpoint,
				keys: { auth: subscription.auth, p256dh: subscription.p256dh },
			},
			JSON.stringify(payload),
		);
	});

	test.each([404, 410])(
		"marks status %s as an expired subscription",
		async (statusCode) => {
			sendNotification.mockRejectedValue({ statusCode });
			const service = createWebPushService(config);

			const error = await service
				.send(subscription, payload)
				.catch((caught: unknown) => caught);
			expect(error).toBeInstanceOf(WebPushSendError);
			expect((error as WebPushSendError).isSubscriptionExpired).toBe(true);
		},
	);

	test("retains transient errors without marking the subscription expired", async () => {
		sendNotification.mockRejectedValue({ statusCode: 503 });
		const service = createWebPushService(config);

		const error = await service
			.send(subscription, payload)
			.catch((caught: unknown) => caught);
		expect(error).toBeInstanceOf(WebPushSendError);
		expect((error as WebPushSendError).statusCode).toBe(503);
		expect((error as WebPushSendError).isSubscriptionExpired).toBe(false);
	});
});

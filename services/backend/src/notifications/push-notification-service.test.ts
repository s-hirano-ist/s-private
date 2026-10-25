import {
	WebPushSendError,
	type WebPushPayload,
} from "@s-hirano-ist/s-notification";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";

const { captureException, send } = vi.hoisted(() => ({
	captureException: vi.fn(),
	send: vi.fn(),
}));

vi.mock("@s-hirano-ist/s-notification", async (importOriginal) => ({
	...(await importOriginal<typeof import("@s-hirano-ist/s-notification")>()),
	createWebPushService: vi.fn(() => ({ send })),
}));

import type { PushSubscriptionRepository } from "s-private-backend/notifications/ports";
import { createPushDeliveryService } from "s-private-backend/notifications/push-notification-service";
const listAll = vi.fn<PushSubscriptionRepository["listAll"]>();
const deleteByIds = vi.fn<PushSubscriptionRepository["deleteByIds"]>();
const repository: PushSubscriptionRepository = {
	listAll,
	deleteByIds,
	deleteOwned: vi.fn(),
	findByEndpoint: vi.fn(),
	findOwned: vi.fn(),
	save: vi.fn(),
};
const { sendPushToAll } = createPushDeliveryService(
	{
		NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: "public",
		WEB_PUSH_PRIVATE_KEY: "private",
		WEB_PUSH_SUBJECT: "mailto:test@example.com",
	},
	repository,
	{ captureException },
);

const payload: WebPushPayload = {
	body: "body",
	icon: "/apple-icon.png",
	tag: "tag",
	title: "title",
	url: "https://gigazine.net/news/20260918-headline",
};
const subscriptions = [
	{
		auth: "a1",
		endpoint: "https://push.example.com/1",
		id: "1",
		userId: "owner",
		p256dh: "p1",
	},
	{
		auth: "a2",
		endpoint: "https://push.example.com/2",
		id: "2",
		userId: "owner",
		p256dh: "p2",
	},
];

describe("sendPushToAll", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		listAll.mockResolvedValue(subscriptions);
		deleteByIds.mockResolvedValue(undefined);
		send.mockResolvedValue(undefined);
	});

	test("sends to every subscription", async () => {
		await expect(sendPushToAll(payload)).resolves.toEqual({
			expired: 0,
			failed: 0,
			sent: 2,
		});
		expect(send).toHaveBeenCalledTimes(2);
	});

	test("deletes expired subscriptions", async () => {
		send.mockRejectedValueOnce(new WebPushSendError({ statusCode: 410 }));
		await expect(sendPushToAll(payload)).resolves.toEqual({
			expired: 1,
			failed: 0,
			sent: 1,
		});
		expect(deleteByIds).toHaveBeenCalledWith(["1"]);
	});

	test("reports transient failures without deleting the subscription", async () => {
		const error = new WebPushSendError({ statusCode: 503 });
		send.mockRejectedValueOnce(error);
		await expect(sendPushToAll(payload)).resolves.toEqual({
			expired: 0,
			failed: 1,
			sent: 1,
		});
		expect(deleteByIds).not.toHaveBeenCalled();
		expect(captureException).toHaveBeenCalledWith(error, expect.any(Object));
	});

	test("does not require VAPID configuration when there are no subscribers", async () => {
		listAll.mockResolvedValue([]);
		await expect(sendPushToAll(payload)).resolves.toEqual({
			expired: 0,
			failed: 0,
			sent: 0,
		});
		expect(send).not.toHaveBeenCalled();
	});
});

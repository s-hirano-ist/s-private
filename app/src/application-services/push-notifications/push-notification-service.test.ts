import type { Mock } from "vitest";
import prisma from "@/prisma";
import {
	WebPushSendError,
	type WebPushPayload,
} from "@s-hirano-ist/s-notification";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { captureException, send } = vi.hoisted(() => ({
	captureException: vi.fn(),
	send: vi.fn(),
}));

vi.mock("@s-hirano-ist/s-notification", async (importOriginal) => ({
	...(await importOriginal<typeof import("@s-hirano-ist/s-notification")>()),
	createWebPushService: vi.fn(() => ({ send })),
}));
vi.mock("@sentry/nextjs", () => ({ captureException }));

import { sendPushToAll } from "./push-notification-service";

const payload: WebPushPayload = {
	body: "body",
	icon: "/apple-icon.png",
	tag: "tag",
	title: "title",
	url: "https://gigazine.net/news/20260918-headline",
};
const subscriptions = [
	{ auth: "a1", endpoint: "https://push.example.com/1", id: "1", p256dh: "p1" },
	{ auth: "a2", endpoint: "https://push.example.com/2", id: "2", p256dh: "p2" },
];

describe("sendPushToAll", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(prisma.pushSubscription.findMany as Mock).mockResolvedValue(subscriptions);
		(prisma.pushSubscription.deleteMany as Mock).mockResolvedValue({
			count: 1,
		});
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
		expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
			where: { id: { in: ["1"] } },
		});
	});

	test("reports transient failures without deleting the subscription", async () => {
		const error = new WebPushSendError({ statusCode: 503 });
		send.mockRejectedValueOnce(error);
		await expect(sendPushToAll(payload)).resolves.toEqual({
			expired: 0,
			failed: 1,
			sent: 1,
		});
		expect(prisma.pushSubscription.deleteMany).not.toHaveBeenCalled();
		expect(captureException).toHaveBeenCalledWith(error, expect.any(Object));
	});

	test("does not require VAPID configuration when there are no subscribers", async () => {
		(prisma.pushSubscription.findMany as Mock).mockResolvedValue([]);
		await expect(sendPushToAll(payload)).resolves.toEqual({
			expired: 0,
			failed: 0,
			sent: 0,
		});
		expect(send).not.toHaveBeenCalled();
	});
});

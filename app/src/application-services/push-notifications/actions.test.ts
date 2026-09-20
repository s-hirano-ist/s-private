import type { Mock } from "vitest";
import prisma from "@/prisma";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { getSelfId, sendPushToSubscription, wrapServerSideErrorForClient } =
	vi.hoisted(() => ({
		getSelfId: vi.fn(),
		sendPushToSubscription: vi.fn(),
		wrapServerSideErrorForClient: vi.fn(),
	}));

vi.mock("@/common/auth/session", () => ({ getSelfId }));
vi.mock("@/common/error/error-wrapper", () => ({
	wrapServerSideErrorForClient,
}));
vi.mock("./push-notification-service", () => ({ sendPushToSubscription }));

import { sendTestPush, subscribeToPush, unsubscribeFromPush } from "./actions";

const input = {
	endpoint: "https://push.example.com/subscription",
	keys: { auth: "auth", p256dh: "p256dh" },
};

describe("push notification actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSelfId.mockResolvedValue("user-1");
		wrapServerSideErrorForClient.mockResolvedValue({
			message: "unexpected",
			success: false,
		});
		(prisma.pushSubscription.findUnique as Mock).mockResolvedValue(null);
		(prisma.pushSubscription.upsert as Mock).mockResolvedValue({});
		(prisma.pushSubscription.deleteMany as Mock).mockResolvedValue({
			count: 1,
		});
	});

	test("upserts a subscription for the authenticated user", async () => {
		await expect(subscribeToPush(input)).resolves.toEqual({
			message: "pushSubscribed",
			success: true,
		});
		expect(prisma.pushSubscription.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				create: expect.objectContaining({
					auth: "auth",
					endpoint: input.endpoint,
					p256dh: "p256dh",
					userId: "user-1",
				}),
			}),
		);
	});

	test("does not let another user take over an endpoint", async () => {
		(prisma.pushSubscription.findUnique as Mock).mockResolvedValue({
			userId: "user-2",
		});
		await expect(subscribeToPush(input)).resolves.toEqual({
			message: "unexpected",
			success: false,
		});
		expect(prisma.pushSubscription.upsert).not.toHaveBeenCalled();
	});

	test("scopes unsubscribe to the current user", async () => {
		await unsubscribeFromPush(input.endpoint);
		expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
			where: { endpoint: input.endpoint, userId: "user-1" },
		});
	});

	test("sends a test notification only to the current user's subscription", async () => {
		const stored = {
			...input.keys,
			endpoint: input.endpoint,
			userId: "user-1",
		};
		(prisma.pushSubscription.findFirst as Mock).mockResolvedValue(stored);
		await expect(sendTestPush(input.endpoint)).resolves.toEqual({
			message: "pushTestSent",
			success: true,
		});
		expect(prisma.pushSubscription.findFirst).toHaveBeenCalledWith({
			where: { endpoint: input.endpoint, userId: "user-1" },
		});
		expect(sendPushToSubscription).toHaveBeenCalledWith(
			stored,
			expect.objectContaining({ title: "Web Push test" }),
		);
	});
});

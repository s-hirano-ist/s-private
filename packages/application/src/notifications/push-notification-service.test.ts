import type { PushSubscriptionRepository } from "@s-hirano-ist/s-application/notifications/ports";
import { PushDeliveryError } from "@s-hirano-ist/s-application/notifications/delivery-port";
import { createPushDeliveryService } from "@s-hirano-ist/s-application/notifications/push-notification-service";
import { expect, test, vi } from "vitest";

test("delivery policy removes only expired endpoints and records transient failures", async () => {
	const payload = {
		body: "body",
		icon: "icon",
		tag: "tag",
		title: "title",
		url: "https://example.com",
	};
	const send = vi
		.fn()
		.mockRejectedValueOnce(new PushDeliveryError(true, new Error("expired")))
		.mockRejectedValueOnce(new PushDeliveryError(false, new Error("transient")))
		.mockResolvedValueOnce(undefined);
	const deleteByIds = vi.fn();
	const repository = {
		listAll: vi.fn().mockResolvedValue(
			[1, 2, 3].map((n) => ({
				id: String(n),
				userId: "owner",
				endpoint: `https://push.example/${n}`,
				auth: "auth",
				p256dh: "key",
			})),
		),
		deleteByIds,
	} as unknown as PushSubscriptionRepository;
	const captureException = vi.fn();
	const service = createPushDeliveryService({ send }, repository, {
		captureException,
	});
	expect(await service.sendPushToAll(payload)).toEqual({
		expired: 1,
		failed: 1,
		sent: 1,
	});
	expect(deleteByIds).toHaveBeenCalledWith(["1"]);
	expect(captureException).toHaveBeenCalledTimes(1);
});

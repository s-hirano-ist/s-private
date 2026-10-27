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
		requiresResubscribe: 0,
		expired: 1,
		failed: 1,
		sent: 1,
	});
	expect(deleteByIds).toHaveBeenCalledWith(["1"]);
	expect(captureException).toHaveBeenCalledTimes(1);
});

test.each([true, false])(
	"pauses a mismatched snapshot once and keeps concurrent updates safe (%s)",
	async (changed) => {
		const snapshot = {
			id: "id",
			userId: "owner",
			endpoint: "https://web.push.apple.com/private",
			auth: "auth",
			p256dh: "key",
			requiresResubscribe: false,
			updatedAt: new Date(),
		};
		const markRequiresResubscribe = vi.fn().mockResolvedValue(changed);
		const repository = {
			listAll: vi.fn().mockResolvedValue([snapshot]),
			markRequiresResubscribe,
			deleteByIds: vi.fn(),
		} as unknown as PushSubscriptionRepository;
		const send = vi
			.fn()
			.mockRejectedValue(
				new PushDeliveryError(
					false,
					undefined,
					{ statusCode: 400, providerCode: "VapidPkHashMismatch" },
					true,
				),
			);
		const captureException = vi.fn();
		const service = createPushDeliveryService({ send }, repository, {
			captureException,
		});
		const payload = {
			title: "test",
			body: "body",
			icon: "/icon.png",
			tag: "test",
			url: "https://example.com",
		};
		await expect(service.sendPushToAll(payload)).resolves.toEqual({
			sent: 0,
			failed: 0,
			expired: 0,
			requiresResubscribe: 1,
		});
		expect(markRequiresResubscribe).toHaveBeenCalledWith(
			snapshot.id,
			snapshot.updatedAt,
		);
		expect(captureException).toHaveBeenCalledTimes(Number(changed));
		snapshot.requiresResubscribe = true;
		await service.sendPushToAll(payload);
		expect(send).toHaveBeenCalledTimes(1);
		expect(repository.deleteByIds).not.toHaveBeenCalled();
	},
);

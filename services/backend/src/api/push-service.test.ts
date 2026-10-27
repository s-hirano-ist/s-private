import type { PushSubscriptionRepository } from "s-private-backend/notifications/ports";
import type { createPushDeliveryService } from "s-private-backend/notifications/push-notification-service";
import { Prisma } from "@s-hirano-ist/s-database";
import { createPushService } from "s-private-backend/api/push-service";
import { describe, expect, test, vi } from "vitest";
const input = {
	endpoint: "https://push.example/subscription",
	keys: { auth: "auth", p256dh: "key" },
};
function fixture(publicKey: string | undefined = "public") {
	const repository = {
		findByEndpoint: vi
			.fn<PushSubscriptionRepository["findByEndpoint"]>()
			.mockResolvedValue(null),
		findOwned: vi
			.fn<PushSubscriptionRepository["findOwned"]>()
			.mockResolvedValue(null),
		save: vi.fn<PushSubscriptionRepository["save"]>().mockResolvedValue(),
		deleteOwned: vi
			.fn<PushSubscriptionRepository["deleteOwned"]>()
			.mockResolvedValue(),
		listAll: vi.fn<PushSubscriptionRepository["listAll"]>(),
		deleteByIds: vi.fn<PushSubscriptionRepository["deleteByIds"]>(),
	};
	const send = vi
		.fn<
			ReturnType<typeof createPushDeliveryService>["sendPushToSubscription"]
		>()
		.mockResolvedValue();
	return {
		repository,
		send,
		service: createPushService(repository, publicKey, send),
	};
}
describe("Shared API push ownership", () => {
	test("saves and deletes subscriptions only for the authenticated owner", async () => {
		const { repository, service } = fixture();
		await service.subscribe("owner", input);
		expect(repository.save).toHaveBeenCalledWith(
			"owner",
			input.endpoint,
			"auth",
			"key",
		);
		await service.unsubscribe("owner", input.endpoint);
		expect(repository.deleteOwned).toHaveBeenCalledWith(
			"owner",
			input.endpoint,
		);
	});
	test("rejects a foreign endpoint before updating its keys", async () => {
		const { repository, service } = fixture();
		repository.findByEndpoint.mockResolvedValue({
			id: "id",
			userId: "foreign",
			endpoint: input.endpoint,
			auth: "original",
			p256dh: "original",
		});
		await expect(service.subscribe("owner", input)).rejects.toMatchObject({
			code: "FORBIDDEN",
			status: 403,
		});
		expect(repository.save).not.toHaveBeenCalled();
	});
	test("maps an ownership race to forbidden and missing configuration to unavailable", async () => {
		const { repository, service } = fixture();
		repository.save.mockRejectedValue(
			new Prisma.PrismaClientKnownRequestError("unique endpoint", {
				code: "P2002",
				clientVersion: "test",
			}),
		);
		await expect(service.subscribe("owner", input)).rejects.toMatchObject({
			code: "FORBIDDEN",
			status: 403,
		});
		const unconfigured = fixture("");
		await expect(
			unconfigured.service.subscribe("owner", input),
		).rejects.toMatchObject({ code: "API_UNAVAILABLE", status: 503 });
		expect(unconfigured.repository.save).not.toHaveBeenCalled();
	});
	test("never sends a test notification to a missing or foreign subscription", async () => {
		const { service, send, repository } = fixture();
		await expect(service.test("owner", input.endpoint)).rejects.toMatchObject({
			code: "NOT_FOUND",
			status: 404,
		});
		expect(repository.findOwned).toHaveBeenCalledWith("owner", input.endpoint);
		expect(send).not.toHaveBeenCalled();
	});
});

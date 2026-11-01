import type { SendPush } from "@s-hirano-ist/s-application/notifications/delivery-port";
import type { PushSubscriptionRepository } from "@s-hirano-ist/s-application/notifications/ports";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import { PushDeliveryError } from "@s-hirano-ist/s-application/notifications/delivery-port";
import { PushSubscriptionError } from "@s-hirano-ist/s-application/notifications/error";
import { createPushService } from "s-private-backend/api/push-service";
import { describe, expect, test, vi } from "vitest";
const input = {
	applicationServerKey: "public",
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
		markRequiresResubscribe: vi.fn(),
		listAll: vi.fn<PushSubscriptionRepository["listAll"]>(),
		deleteByIds: vi.fn<PushSubscriptionRepository["deleteByIds"]>(),
	};
	const send = vi.fn<SendPush>().mockResolvedValue();
	return {
		repository,
		send,
		service: createPushService(
			repository,
			() => {
				if (!publicKey)
					throw new PushSubscriptionError("UNAVAILABLE", "missing");
				return publicKey;
			},
			send,
			{ captureException: vi.fn() },
		),
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
			undefined,
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
			requiresResubscribe: false,
			updatedAt: new Date(),
			id: "id",
			userId: "foreign",
			endpoint: input.endpoint,
			auth: "original",
			p256dh: "original",
		});
		await expect(service.subscribe("owner", input)).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
		expect(repository.save).not.toHaveBeenCalled();
	});
	test("maps an ownership race to forbidden and missing configuration to unavailable", async () => {
		const { repository, service } = fixture();
		repository.save.mockRejectedValue(new ApplicationError("FORBIDDEN"));
		await expect(service.subscribe("owner", input)).rejects.toMatchObject({
			code: "FORBIDDEN",
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

test("status discloses only the current owner's registration and validates the submitted key", async () => {
	const { service, repository } = fixture();
	await expect(service.status("owner", input.endpoint)).resolves.toEqual({
		publicKey: "public",
		registered: false,
		requiresResubscribe: false,
	});
	expect(repository.findOwned).toHaveBeenCalledWith("owner", input.endpoint);
	await expect(
		service.subscribe("owner", { ...input, applicationServerKey: "stale" }),
	).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
	expect(repository.save).not.toHaveBeenCalled();
});
test("marks test delivery mismatches with the snapshot and returns 409, while paused subscriptions are not sent", async () => {
	const { service, repository, send } = fixture();
	const snapshot = {
		id: "id",
		userId: "owner",
		endpoint: input.endpoint,
		auth: "auth",
		p256dh: "key",
		requiresResubscribe: false,
		updatedAt: new Date(),
	};
	repository.findOwned.mockResolvedValue(snapshot);
	send.mockRejectedValueOnce(
		new PushDeliveryError(
			false,
			undefined,
			{ statusCode: 400, providerCode: "VapidPkHashMismatch" },
			true,
		),
	);
	await expect(service.test("owner", input.endpoint)).rejects.toMatchObject({
		code: "PUSH_RESUBSCRIPTION_REQUIRED",
		status: 409,
	});
	expect(repository.markRequiresResubscribe).toHaveBeenCalledWith(
		snapshot.id,
		snapshot.updatedAt,
	);
	snapshot.requiresResubscribe = true;
	await expect(service.test("owner", input.endpoint)).rejects.toMatchObject({
		status: 409,
	});
	expect(send).toHaveBeenCalledTimes(1);
});

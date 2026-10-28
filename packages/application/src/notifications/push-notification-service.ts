import type { PushSubscriptionRepository } from "@s-hirano-ist/s-application/notifications/ports";
import type { ErrorReporter } from "@s-hirano-ist/s-application/observability/reporter";
import {
	PushDeliveryError,
	type PushPayload,
	type PushSender,
	type PushDeliverySummary,
} from "@s-hirano-ist/s-application/notifications/delivery-port";
import { PushSubscriptionError } from "@s-hirano-ist/s-application/notifications/error";

export function createPushDeliveryService(
	sender: PushSender,
	pushSubscriptionRepository: PushSubscriptionRepository,
	reporter: Pick<ErrorReporter, "captureException">,
) {
	async function sendPushToAll(
		payload: PushPayload,
	): Promise<PushDeliverySummary> {
		const subscriptions = await pushSubscriptionRepository.listAll();
		if (subscriptions.length === 0) return { expired: 0, failed: 0, sent: 0 };

		const service = sender;
		const expiredIds: string[] = [];
		let failed = 0;
		let sent = 0;

		await Promise.all(
			subscriptions.map(async (subscription) => {
				try {
					await service.send(subscription, payload);
					sent += 1;
				} catch (error) {
					if (
						error instanceof PushSubscriptionError &&
						error.code === "UNAVAILABLE"
					)
						throw error;
					if (
						error instanceof PushDeliveryError &&
						error.isSubscriptionExpired
					) {
						expiredIds.push(subscription.id);
						return;
					}
					failed += 1;
					reporter.captureException(error, {
						tags: { source: "web-push" },
						extra: { subscriptionId: subscription.id },
					});
				}
			}),
		);

		if (expiredIds.length > 0) {
			await pushSubscriptionRepository.deleteByIds(expiredIds);
		}

		return { expired: expiredIds.length, failed, sent };
	}

	async function sendPushToSubscription(
		subscription: { auth: string; endpoint: string; p256dh: string },
		payload: PushPayload,
	): Promise<void> {
		await sender.send(subscription, payload);
	}

	return { sendPushToAll, sendPushToSubscription };
}

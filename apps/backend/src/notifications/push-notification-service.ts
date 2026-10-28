import type { PushSubscriptionRepository } from "@s-hirano-ist/s-application/notifications/ports";
import type { ErrorReporter } from "s-private-backend/observability/reporter";
import {
	createWebPushService,
	WebPushSendError,
	type WebPushPayload,
	type WebPushService,
} from "@s-hirano-ist/s-notification";
import { PushSubscriptionError } from "s-private-backend/notifications/error";

export type PushDeliverySummary = {
	expired: number;
	failed: number;
	sent: number;
};

export type PushConfig = {
	NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?: string;
	WEB_PUSH_PRIVATE_KEY?: string;
	WEB_PUSH_SUBJECT?: string;
};
export function createPushDeliveryService(
	env: PushConfig,
	pushSubscriptionRepository: PushSubscriptionRepository,
	reporter: Pick<ErrorReporter, "captureException">,
) {
	function requireWebPushService(): WebPushService {
		const {
			NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
			WEB_PUSH_PRIVATE_KEY,
			WEB_PUSH_SUBJECT,
		} = env;
		if (
			!NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ||
			!WEB_PUSH_PRIVATE_KEY ||
			!WEB_PUSH_SUBJECT
		) {
			throw new PushSubscriptionError(
				"UNAVAILABLE",
				"Web Push VAPID configuration is missing",
			);
		}
		return createWebPushService({
			privateKey: WEB_PUSH_PRIVATE_KEY,
			publicKey: NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
			subject: WEB_PUSH_SUBJECT,
		});
	}

	async function sendPushToAll(
		payload: WebPushPayload,
	): Promise<PushDeliverySummary> {
		const subscriptions = await pushSubscriptionRepository.listAll();
		if (subscriptions.length === 0) return { expired: 0, failed: 0, sent: 0 };

		const service = requireWebPushService();
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
						error instanceof WebPushSendError &&
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
		payload: WebPushPayload,
	): Promise<void> {
		await requireWebPushService().send(subscription, payload);
	}

	return { sendPushToAll, sendPushToSubscription };
}

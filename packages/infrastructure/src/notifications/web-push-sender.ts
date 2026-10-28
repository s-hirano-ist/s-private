import type { PushSender } from "@s-hirano-ist/s-application/notifications/delivery-port";
import { PushDeliveryError } from "@s-hirano-ist/s-application/notifications/delivery-port";
import { PushSubscriptionError } from "@s-hirano-ist/s-application/notifications/error";
import {
	createWebPushService,
	WebPushSendError,
} from "@s-hirano-ist/s-notification";
export type PushConfig = {
	NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?: string;
	WEB_PUSH_PRIVATE_KEY?: string;
	WEB_PUSH_SUBJECT?: string;
};
export function createWebPushSender(config: PushConfig): PushSender {
	return {
		async send(subscription, payload) {
			const {
				NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
				WEB_PUSH_PRIVATE_KEY,
				WEB_PUSH_SUBJECT,
			} = config;
			if (
				!NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ||
				!WEB_PUSH_PRIVATE_KEY ||
				!WEB_PUSH_SUBJECT
			)
				throw new PushSubscriptionError(
					"UNAVAILABLE",
					"Web Push VAPID configuration is missing",
				);
			try {
				await createWebPushService({
					publicKey: NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
					privateKey: WEB_PUSH_PRIVATE_KEY,
					subject: WEB_PUSH_SUBJECT,
				}).send(subscription, payload);
			} catch (error) {
				if (error instanceof WebPushSendError)
					throw new PushDeliveryError(error.isSubscriptionExpired, error);
				throw error;
			}
		},
	};
}

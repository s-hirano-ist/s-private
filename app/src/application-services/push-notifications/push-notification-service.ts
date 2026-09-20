import "server-only";
import { env } from "@/env";
import prisma from "@/prisma";
import {
	createWebPushService,
	WebPushSendError,
	type WebPushPayload,
	type WebPushService,
} from "@s-hirano-ist/s-notification";
import * as Sentry from "@sentry/nextjs";

export type PushDeliverySummary = {
	expired: number;
	failed: number;
	sent: number;
};

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
		throw new Error("Web Push VAPID configuration is missing");
	}
	return createWebPushService({
		privateKey: WEB_PUSH_PRIVATE_KEY,
		publicKey: NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
		subject: WEB_PUSH_SUBJECT,
	});
}

export async function sendPushToAll(
	payload: WebPushPayload,
): Promise<PushDeliverySummary> {
	const subscriptions = await prisma.pushSubscription.findMany();
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
				if (error instanceof WebPushSendError && error.isSubscriptionExpired) {
					expiredIds.push(subscription.id);
					return;
				}
				failed += 1;
				Sentry.captureException(error, {
					tags: { source: "web-push" },
					extra: { subscriptionId: subscription.id },
				});
			}
		}),
	);

	if (expiredIds.length > 0) {
		await prisma.pushSubscription.deleteMany({
			where: { id: { in: expiredIds } },
		});
	}

	return { expired: expiredIds.length, failed, sent };
}

export async function sendPushToSubscription(
	subscription: { auth: string; endpoint: string; p256dh: string },
	payload: WebPushPayload,
): Promise<void> {
	await requireWebPushService().send(subscription, payload);
}

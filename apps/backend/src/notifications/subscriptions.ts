import type { PushSubscriptionRepository } from "@s-hirano-ist/s-application/notifications/ports";
import type { createPushDeliveryService } from "s-private-backend/notifications/push-notification-service";
import { PushSubscriptionError } from "s-private-backend/notifications/error";
import { buildGigazineHeadline } from "s-private-backend/notifications/gigazine-headline";
import { z } from "zod";
export const subscriptionSchema = z.object({
	endpoint: z.url(),
	keys: z.object({ auth: z.string().min(1), p256dh: z.string().min(1) }),
});
export type BrowserPushSubscription = z.infer<typeof subscriptionSchema>;
export async function subscribeToPush(
	userId: string,
	input: BrowserPushSubscription,
	publicKey: string | undefined,
	repository: PushSubscriptionRepository,
): Promise<void> {
	if (!publicKey)
		throw new PushSubscriptionError(
			"UNAVAILABLE",
			"Web Push public key is missing",
		);
	const subscription = subscriptionSchema.parse(input);
	const existing = await repository.findByEndpoint(subscription.endpoint);
	if (existing && existing.userId !== userId)
		throw new PushSubscriptionError(
			"FORBIDDEN",
			"Push subscription belongs to another user",
		);
	await repository.save(
		userId,
		subscription.endpoint,
		subscription.keys.auth,
		subscription.keys.p256dh,
	);
}
export async function unsubscribeFromPush(
	userId: string,
	endpoint: string,
	repository: PushSubscriptionRepository,
): Promise<void> {
	await repository.deleteOwned(userId, endpoint);
}
export async function sendTestPush(
	userId: string,
	endpoint: string,
	repository: PushSubscriptionRepository,
	send: ReturnType<typeof createPushDeliveryService>["sendPushToSubscription"],
): Promise<void> {
	const subscription = await repository.findOwned(userId, endpoint);
	if (!subscription)
		throw new PushSubscriptionError("NOT_FOUND", "Push subscription not found");
	const headline = buildGigazineHeadline();
	await send(subscription, {
		...headline.payload,
		tag: `web-push-test-${Date.now()}`,
		title: "Web Push test",
	});
}

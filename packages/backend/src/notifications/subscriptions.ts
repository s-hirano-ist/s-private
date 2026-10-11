import type { PushSubscriptionRepository } from "@s-hirano-ist/s-backend/notifications/ports";
import type { createPushDeliveryService } from "@s-hirano-ist/s-backend/notifications/push-notification-service";
import { buildGigazineHeadline } from "@s-hirano-ist/s-backend/notifications/gigazine-headline";
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
	if (!publicKey) throw new Error("Web Push public key is missing");
	const subscription = subscriptionSchema.parse(input);
	const existing = await repository.findByEndpoint(subscription.endpoint);
	if (existing && existing.userId !== userId)
		throw new Error("Push subscription belongs to another user");
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
	if (!subscription) throw new Error("Push subscription not found");
	const headline = buildGigazineHeadline();
	await send(subscription, {
		...headline.payload,
		tag: `web-push-test-${Date.now()}`,
		title: "Web Push test",
	});
}

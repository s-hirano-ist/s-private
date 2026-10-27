import type { SendPush } from "@s-hirano-ist/s-application/notifications/delivery-port";
import type { PushSubscriptionRepository } from "@s-hirano-ist/s-application/notifications/ports";
import type { ErrorReporter } from "@s-hirano-ist/s-application/observability/reporter";
import { PushDeliveryError } from "@s-hirano-ist/s-application/notifications/delivery-port";
import { PushSubscriptionError } from "@s-hirano-ist/s-application/notifications/error";
import { buildGigazineHeadline } from "@s-hirano-ist/s-application/notifications/gigazine-headline";
import { pushFailureDiagnostic } from "@s-hirano-ist/s-application/notifications/push-notification-service";
import { z } from "zod";
export const subscriptionSchema = z.object({
	endpoint: z.url(),
	applicationServerKey: z.string().min(1),
	replacesEndpoint: z.url().optional(),
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
	if (
		subscription.applicationServerKey.replace(/={1,2}$/u, "") !==
		publicKey.replace(/={1,2}$/u, "")
	)
		throw new PushSubscriptionError(
			"INVALID_KEY",
			"Push key changed; reload notification settings",
		);
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
		subscription.replacesEndpoint,
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
	send: SendPush,
	reporter: Pick<ErrorReporter, "captureException">,
): Promise<void> {
	const subscription = await repository.findOwned(userId, endpoint);
	if (!subscription)
		throw new PushSubscriptionError("NOT_FOUND", "Push subscription not found");
	if (subscription.requiresResubscribe)
		throw new PushSubscriptionError(
			"REQUIRES_RESUBSCRIBE",
			"Push subscription requires renewal",
		);
	const headline = buildGigazineHeadline();
	try {
		await send(subscription, {
			...headline.payload,
			tag: `web-push-test-${Date.now()}`,
			title: "Web Push test",
		});
	} catch (error) {
		if (error instanceof PushDeliveryError && error.requiresResubscribe) {
			const changed = await repository.markRequiresResubscribe(
				subscription.id,
				subscription.updatedAt,
			);
			if (changed) {
				const diagnostic = pushFailureDiagnostic(
					error,
					subscription.endpoint,
					subscription.id,
				);
				reporter.captureException(diagnostic.error, diagnostic.context);
			}
			throw new PushSubscriptionError(
				"REQUIRES_RESUBSCRIBE",
				"Push subscription requires renewal",
			);
		}
		if (error instanceof PushDeliveryError && error.isSubscriptionExpired) {
			await repository.deleteByIds([subscription.id]);
		}
		throw error;
	}
}

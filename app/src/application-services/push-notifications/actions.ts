"use server";
import "server-only";
import type { ServerAction } from "@/common/types";
import { pushSubscriptionRepository } from "@/application-services/push-notifications/deps";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { env } from "@/env";
import { z } from "zod";
import { buildGigazineHeadline } from "./gigazine-headline";
import { sendPushToSubscription } from "./push-notification-service";

const subscriptionSchema = z.object({
	endpoint: z.url(),
	keys: z.object({
		auth: z.string().min(1),
		p256dh: z.string().min(1),
	}),
});

export type BrowserPushSubscription = z.infer<typeof subscriptionSchema>;

export async function subscribeToPush(
	input: BrowserPushSubscription,
): Promise<ServerAction> {
	try {
		if (!env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY) {
			throw new Error("Web Push public key is missing");
		}
		const subscription = subscriptionSchema.parse(input);
		const userId = await getSelfId();
		const existing = await pushSubscriptionRepository.findByEndpoint(
			subscription.endpoint,
		);
		if (existing && existing.userId !== userId) {
			throw new Error("Push subscription belongs to another user");
		}
		await pushSubscriptionRepository.save(
			userId,
			subscription.endpoint,
			subscription.keys.auth,
			subscription.keys.p256dh,
		);
		return { message: "pushSubscribed", success: true };
	} catch (error) {
		return wrapServerSideErrorForClient(error);
	}
}

export async function unsubscribeFromPush(
	endpoint: string,
): Promise<ServerAction> {
	try {
		const userId = await getSelfId();
		await pushSubscriptionRepository.deleteOwned(userId, endpoint);
		return { message: "pushUnsubscribed", success: true };
	} catch (error) {
		return wrapServerSideErrorForClient(error);
	}
}

export async function sendTestPush(endpoint: string): Promise<ServerAction> {
	try {
		const userId = await getSelfId();
		const subscription = await pushSubscriptionRepository.findOwned(
			userId,
			endpoint,
		);
		if (!subscription) throw new Error("Push subscription not found");
		const headline = buildGigazineHeadline();
		await sendPushToSubscription(subscription, {
			...headline.payload,
			tag: `web-push-test-${Date.now()}`,
			title: "Web Push test",
		});
		return { message: "pushTestSent", success: true };
	} catch (error) {
		return wrapServerSideErrorForClient(error);
	}
}

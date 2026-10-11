"use server";
import "server-only";
import type { ServerAction } from "@/common/types";
import type { BrowserPushSubscription } from "@s-hirano-ist/s-backend/notifications/subscriptions";
export type { BrowserPushSubscription } from "@s-hirano-ist/s-backend/notifications/subscriptions";
import { pushSubscriptionRepository } from "@/application-services/push-notifications/deps";
import { sendPushToSubscription } from "@/application-services/push-notifications/push-notification-service";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { env } from "@/env";
import {
	subscribeToPush as subscribe,
	unsubscribeFromPush as unsubscribe,
	sendTestPush as sendTest,
} from "@s-hirano-ist/s-backend/notifications/subscriptions";
export async function subscribeToPush(
	input: BrowserPushSubscription,
): Promise<ServerAction> {
	try {
		await subscribe(
			await getSelfId(),
			input,
			env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
			pushSubscriptionRepository,
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
		await unsubscribe(await getSelfId(), endpoint, pushSubscriptionRepository);
		return { message: "pushUnsubscribed", success: true };
	} catch (error) {
		return wrapServerSideErrorForClient(error);
	}
}
export async function sendTestPush(endpoint: string): Promise<ServerAction> {
	try {
		await sendTest(
			await getSelfId(),
			endpoint,
			pushSubscriptionRepository,
			sendPushToSubscription,
		);
		return { message: "pushTestSent", success: true };
	} catch (error) {
		return wrapServerSideErrorForClient(error);
	}
}

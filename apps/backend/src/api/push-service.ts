import type { SendPush } from "@s-hirano-ist/s-application/notifications/delivery-port";
import type { PushSubscriptionRepository } from "@s-hirano-ist/s-application/notifications/ports";
import type { BrowserPushSubscription } from "@s-hirano-ist/s-application/notifications/subscriptions";
import { PushSubscriptionError } from "@s-hirano-ist/s-application/notifications/error";
import {
	subscribeToPush,
	unsubscribeFromPush,
	sendTestPush,
} from "@s-hirano-ist/s-application/notifications/subscriptions";
import { ApiError } from "s-private-backend/api/error";
async function run(work: () => Promise<void>) {
	try {
		await work();
	} catch (error) {
		if (error instanceof PushSubscriptionError) {
			switch (error.code) {
				case "UNAVAILABLE":
					throw new ApiError("API_UNAVAILABLE");
				case "FORBIDDEN":
					throw new ApiError("FORBIDDEN");
				case "NOT_FOUND":
					throw new ApiError("NOT_FOUND");
			}
		}
		throw error;
	}
}
export function createPushService(
	repository: PushSubscriptionRepository,
	publicKey: string | undefined,
	send: SendPush,
) {
	return {
		subscribe: (owner: string, input: BrowserPushSubscription) =>
			run(() => subscribeToPush(owner, input, publicKey, repository)),
		unsubscribe: (owner: string, endpoint: string) =>
			run(() => unsubscribeFromPush(owner, endpoint, repository)),
		test: (owner: string, endpoint: string) =>
			run(() => sendTestPush(owner, endpoint, repository, send)),
	};
}
export type PushService = ReturnType<typeof createPushService>;

import type { PushSubscriptionRepository } from "@s-hirano-ist/s-backend/notifications/ports";
import type { createPushDeliveryService } from "@s-hirano-ist/s-backend/notifications/push-notification-service";
import type { BrowserPushSubscription } from "@s-hirano-ist/s-backend/notifications/subscriptions";
import { MobileApiError } from "@s-hirano-ist/s-backend/mobile/error";
import { PushSubscriptionError } from "@s-hirano-ist/s-backend/notifications/error";
import {
	subscribeToPush,
	unsubscribeFromPush,
	sendTestPush,
} from "@s-hirano-ist/s-backend/notifications/subscriptions";
import { Prisma } from "@s-hirano-ist/s-database";
async function run(work: () => Promise<void>) {
	try {
		await work();
	} catch (error) {
		if (error instanceof PushSubscriptionError) {
			switch (error.code) {
				case "UNAVAILABLE":
					throw new MobileApiError("API_UNAVAILABLE", 503);
				case "FORBIDDEN":
					throw new MobileApiError("FORBIDDEN", 403);
				case "NOT_FOUND":
					throw new MobileApiError("NOT_FOUND", 404);
			}
		}
		// A foreign endpoint inserted between the ownership check and upsert must not be updated.
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		)
			throw new MobileApiError("FORBIDDEN", 403);
		throw error;
	}
}
export function createPushService(
	repository: PushSubscriptionRepository,
	publicKey: string | undefined,
	send: ReturnType<typeof createPushDeliveryService>["sendPushToSubscription"],
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

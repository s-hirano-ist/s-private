import type { SendPush } from "@s-hirano-ist/s-application/notifications/delivery-port";
import type { PushSubscriptionRepository } from "@s-hirano-ist/s-application/notifications/ports";
import type { BrowserPushSubscription } from "@s-hirano-ist/s-application/notifications/subscriptions";
import type { ErrorReporter } from "@s-hirano-ist/s-application/observability/reporter";
import { PushSubscriptionError } from "@s-hirano-ist/s-application/notifications/error";
import {
	subscribeToPush,
	unsubscribeFromPush,
	sendTestPush,
} from "@s-hirano-ist/s-application/notifications/subscriptions";
import { ApiError } from "s-private-backend/api/error";
async function run<T>(work: () => Promise<T>): Promise<T> {
	try {
		return await work();
	} catch (error) {
		if (error instanceof PushSubscriptionError) {
			switch (error.code) {
				case "REQUIRES_RESUBSCRIBE":
					throw new ApiError("PUSH_RESUBSCRIPTION_REQUIRED");
				case "INVALID_KEY":
					throw new ApiError("VALIDATION_ERROR");
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
	getPublicKey: () => string,
	send: SendPush,
	reporter: Pick<ErrorReporter, "captureException">,
) {
	return {
		status: (owner: string, endpoint?: string) =>
			run(async () => {
				const publicKey = getPublicKey();
				const subscription = endpoint
					? await repository.findOwned(owner, endpoint)
					: null;
				return {
					publicKey,
					registered: Boolean(subscription),
					requiresResubscribe: subscription?.requiresResubscribe ?? false,
				};
			}),
		subscribe: (owner: string, input: BrowserPushSubscription) =>
			run(() => subscribeToPush(owner, input, getPublicKey(), repository)),
		unsubscribe: (owner: string, endpoint: string) =>
			run(() => unsubscribeFromPush(owner, endpoint, repository)),
		test: (owner: string, endpoint: string) =>
			run(() => {
				getPublicKey();
				return sendTestPush(owner, endpoint, repository, send, reporter);
			}),
	};
}
export type PushService = ReturnType<typeof createPushService>;

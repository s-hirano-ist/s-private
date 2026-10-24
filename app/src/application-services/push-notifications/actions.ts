"use server";
import "server-only";
import type { ServerAction } from "@/common/types";
import { backendActionError } from "@/common/backend/action-error";
import { getBackendClient } from "@/common/backend/server-client";
import { PushSubscription } from "@s-hirano-ist/s-api-client/models";
export type BrowserPushSubscription = PushSubscription;
export async function subscribeToPush(
	input: BrowserPushSubscription,
): Promise<ServerAction> {
	try {
		await (
			await getBackendClient()
		).subscribeToPush(PushSubscription.parse(input));
		return { message: "pushSubscribed", success: true };
	} catch (error) {
		return backendActionError(error);
	}
}
export async function unsubscribeFromPush(
	endpoint: string,
): Promise<ServerAction> {
	try {
		await (await getBackendClient()).unsubscribeFromPush({ endpoint });
		return { message: "pushUnsubscribed", success: true };
	} catch (error) {
		return backendActionError(error);
	}
}
export async function sendTestPush(endpoint: string): Promise<ServerAction> {
	try {
		await (await getBackendClient()).sendTestPush({ endpoint });
		return { message: "pushTestSent", success: true };
	} catch (error) {
		return backendActionError(error);
	}
}

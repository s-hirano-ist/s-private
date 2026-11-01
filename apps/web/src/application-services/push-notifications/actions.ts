"use server";
import "server-only";
import type { ServerAction, ServerActionWithData } from "@/common/types";
import type { PushStatus } from "@s-hirano-ist/s-api-client/models";
import { backendActionError } from "@/common/backend/action-error";
import { getBackendClient } from "@/common/backend/server-client";
import { PushSubscription } from "@s-hirano-ist/s-api-client/models";
import { ApiHttpError } from "@s-hirano-ist/s-api-client/transport";
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
export async function sendTestPush(
	endpoint: string,
): Promise<ServerAction & { requiresResubscribe?: boolean }> {
	try {
		await (await getBackendClient()).sendTestPush({ endpoint });
		return { message: "pushTestSent", success: true };
	} catch (error) {
		if (
			error instanceof ApiHttpError &&
			error.code === "PUSH_RESUBSCRIPTION_REQUIRED"
		)
			return { ...backendActionError(error), requiresResubscribe: true };
		return backendActionError(error);
	}
}

export async function getPushStatus(
	endpoint?: string,
): Promise<ServerActionWithData<PushStatus>> {
	try {
		const { data } = await (
			await getBackendClient()
		).getPushStatus({ endpoint });
		return { success: true, message: "", data };
	} catch (error) {
		return backendActionError(error);
	}
}

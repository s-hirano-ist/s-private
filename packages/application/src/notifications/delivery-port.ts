export type PushPayload = {
	body: string;
	icon: string;
	tag: string;
	title: string;
	url: string;
};
export type PushRecipient = { auth: string; endpoint: string; p256dh: string };
export type SendPush = (
	subscription: PushRecipient,
	payload: PushPayload,
) => Promise<void>;
export type PushSender = { send: SendPush };
export type PushDeliverySummary = {
	expired: number;
	failed: number;
	sent: number;
};
export type SendPushToAll = (
	payload: PushPayload,
) => Promise<PushDeliverySummary>;
export class PushDeliveryError extends Error {
	constructor(
		readonly isSubscriptionExpired: boolean,
		cause: unknown,
	) {
		super("Push delivery failed", { cause });
		this.name = "PushDeliveryError";
	}
}

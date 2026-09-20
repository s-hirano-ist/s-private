import webPush from "web-push";

export type WebPushConfig = {
	privateKey: string;
	publicKey: string;
	subject: string;
};

export type WebPushSubscription = {
	auth: string;
	endpoint: string;
	p256dh: string;
};

export type WebPushPayload = {
	body: string;
	icon: string;
	tag: string;
	title: string;
	url: string;
};

export class WebPushSendError extends Error {
	readonly statusCode?: number;

	constructor(cause: unknown) {
		super("Failed to send Web Push notification", { cause });
		this.name = "WebPushSendError";
		this.statusCode =
			typeof cause === "object" && cause !== null && "statusCode" in cause
				? Number(cause.statusCode)
				: undefined;
	}

	get isSubscriptionExpired(): boolean {
		return this.statusCode === 404 || this.statusCode === 410;
	}
}

export type WebPushService = {
	send(
		subscription: WebPushSubscription,
		payload: WebPushPayload,
	): Promise<void>;
};

export function createWebPushService(config: WebPushConfig): WebPushService {
	webPush.setVapidDetails(config.subject, config.publicKey, config.privateKey);

	return {
		async send(subscription, payload) {
			try {
				await webPush.sendNotification(
					{
						endpoint: subscription.endpoint,
						keys: {
							auth: subscription.auth,
							p256dh: subscription.p256dh,
						},
					},
					JSON.stringify(payload),
				);
			} catch (error) {
				throw new WebPushSendError(error);
			}
		},
	};
}

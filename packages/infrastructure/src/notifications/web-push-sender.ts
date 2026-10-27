import type { PushSender } from "@s-hirano-ist/s-application/notifications/delivery-port";
import { PushDeliveryError } from "@s-hirano-ist/s-application/notifications/delivery-port";
import { PushSubscriptionError } from "@s-hirano-ist/s-application/notifications/error";
import {
	createWebPushService,
	WebPushSendError,
} from "@s-hirano-ist/s-notification";
import { createECDH } from "node:crypto";
export type PushConfig = {
	NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?: string;
	WEB_PUSH_PRIVATE_KEY?: string;
	WEB_PUSH_SUBJECT?: string;
};
export function createWebPushSender(config: PushConfig): PushSender {
	return {
		async send(subscription, payload) {
			const validated = validatePushConfig(config);
			try {
				await createWebPushService({
					publicKey: validated.publicKey,
					privateKey: validated.privateKey,
					subject: validated.subject,
				}).send(subscription, payload);
			} catch (error) {
				if (error instanceof WebPushSendError)
					throw new PushDeliveryError(
						error.isSubscriptionExpired,
						error,
						{
							statusCode: error.statusCode,
							providerCode: error.providerCode,
						},
						error.statusCode === 400 &&
							error.providerCode === "VapidPkHashMismatch" &&
							new URL(subscription.endpoint).hostname === "web.push.apple.com",
					);
				throw error;
			}
		},
	};
}

export function validatePushConfig(config: PushConfig) {
	const publicKey = config.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
	const privateKey = config.WEB_PUSH_PRIVATE_KEY;
	const subject = config.WEB_PUSH_SUBJECT;
	try {
		if (!publicKey || !privateKey || !subject)
			throw new Error("Missing configuration");
		const ecdh = createECDH("prime256v1");
		const privateKeyBytes = Buffer.from(privateKey, "base64url");
		if (privateKeyBytes.length !== 32)
			throw new Error("Invalid private key length");
		ecdh.setPrivateKey(privateKeyBytes);
		if (!ecdh.getPublicKey().equals(Buffer.from(publicKey, "base64url")))
			throw new Error("Invalid key pair");
		return {
			publicKey: ecdh.getPublicKey().toString("base64url"),
			privateKey: privateKeyBytes.toString("base64url"),
			subject,
		};
	} catch {
		throw new PushSubscriptionError(
			"UNAVAILABLE",
			"Web Push VAPID configuration is missing or invalid",
		);
	}
}

import type { PushSubscriptionRepository } from "s-private-backend/notifications/ports";
import type {
	CaptureContext,
	ErrorReporter,
} from "s-private-backend/observability/reporter";
import {
	createWebPushService,
	WebPushSendError,
	type WebPushPayload,
	type WebPushService,
} from "@s-hirano-ist/s-notification";
import { PushSubscriptionError } from "s-private-backend/notifications/error";

export type PushDeliverySummary = {
	expired: number;
	failed: number;
	sent: number;
};

export type PushConfig = {
	NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?: string;
	WEB_PUSH_PRIVATE_KEY?: string;
	WEB_PUSH_SUBJECT?: string;
};
export function createPushDeliveryService(
	env: PushConfig,
	pushSubscriptionRepository: PushSubscriptionRepository,
	reporter: Pick<ErrorReporter, "captureException">,
) {
	function requireWebPushService(): WebPushService {
		const {
			NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
			WEB_PUSH_PRIVATE_KEY,
			WEB_PUSH_SUBJECT,
		} = env;
		if (
			!NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ||
			!WEB_PUSH_PRIVATE_KEY ||
			!WEB_PUSH_SUBJECT
		) {
			throw new PushSubscriptionError(
				"UNAVAILABLE",
				"Web Push VAPID configuration is missing",
			);
		}
		return createWebPushService({
			privateKey: WEB_PUSH_PRIVATE_KEY,
			publicKey: NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
			subject: WEB_PUSH_SUBJECT,
		});
	}

	async function sendPushToAll(
		payload: WebPushPayload,
	): Promise<PushDeliverySummary> {
		const subscriptions = await pushSubscriptionRepository.listAll();
		if (subscriptions.length === 0) return { expired: 0, failed: 0, sent: 0 };

		const service = requireWebPushService();
		const expiredIds: string[] = [];
		let failed = 0;
		let sent = 0;

		await Promise.all(
			subscriptions.map(async (subscription) => {
				try {
					await service.send(subscription, payload);
					sent += 1;
				} catch (error) {
					if (
						error instanceof WebPushSendError &&
						error.isSubscriptionExpired
					) {
						expiredIds.push(subscription.id);
						return;
					}
					failed += 1;
					const diagnostic = pushFailureDiagnostic(
						error,
						subscription.endpoint,
						subscription.id,
					);
					reporter.captureException(diagnostic.error, diagnostic.context);
				}
			}),
		);

		if (expiredIds.length > 0) {
			await pushSubscriptionRepository.deleteByIds(expiredIds);
		}

		return { expired: expiredIds.length, failed, sent };
	}

	async function sendPushToSubscription(
		subscription: { auth: string; endpoint: string; p256dh: string },
		payload: WebPushPayload,
	): Promise<void> {
		await requireWebPushService().send(subscription, payload);
	}

	return { sendPushToAll, sendPushToSubscription };
}

function failureCategory(status?: number): string {
	if (status === undefined) return "transport-or-unknown";
	if (status === 401 || status === 403) return "authentication";
	if (status === 429) return "rate-limited";
	if (status >= 500) return "provider-unavailable";
	return "request-rejected";
}

/** Never attach the original provider Error: it may contain keys and endpoint URLs. */
function pushFailureDiagnostic(
	error: unknown,
	endpoint: string,
	subscriptionId: string,
): { context: CaptureContext; error: Error } {
	let providerHost = "unknown";
	try {
		providerHost = new URL(endpoint).hostname;
	} catch {
		/* Keep malformed endpoints private. */
	}
	const candidate =
		error instanceof WebPushSendError ? error.statusCode : undefined;
	const status =
		candidate !== undefined &&
		Number.isInteger(candidate) &&
		candidate >= 100 &&
		candidate <= 599
			? candidate
			: undefined;
	const category = failureCategory(status);
	return {
		error: new Error(`Web Push failed: ${category} (${status ?? "unknown"})`),
		context: {
			tags: {
				source: "web-push",
				category,
				providerHost,
				providerCode:
					error instanceof WebPushSendError
						? (error.providerCode ?? "unknown")
						: "unknown",
				statusCode: String(status ?? "unknown"),
			},
			extra: { subscriptionId },
		},
	};
}

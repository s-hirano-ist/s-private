import type { PushSubscriptionRepository } from "@s-hirano-ist/s-application/notifications/ports";
import type {
	CaptureContext,
	ErrorReporter,
} from "@s-hirano-ist/s-application/observability/reporter";
import {
	PushDeliveryError,
	type PushPayload,
	type PushSender,
	type PushDeliverySummary,
} from "@s-hirano-ist/s-application/notifications/delivery-port";
import { PushSubscriptionError } from "@s-hirano-ist/s-application/notifications/error";

export function createPushDeliveryService(
	sender: PushSender,
	pushSubscriptionRepository: PushSubscriptionRepository,
	reporter: Pick<ErrorReporter, "captureException">,
) {
	async function sendPushToAll(
		payload: PushPayload,
	): Promise<PushDeliverySummary> {
		const subscriptions = await pushSubscriptionRepository.listAll();
		if (subscriptions.length === 0) return { expired: 0, failed: 0, sent: 0 };

		const service = sender;
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
						error instanceof PushSubscriptionError &&
						error.code === "UNAVAILABLE"
					)
						throw error;
					if (
						error instanceof PushDeliveryError &&
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
		payload: PushPayload,
	): Promise<void> {
		await sender.send(subscription, payload);
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
		error instanceof PushDeliveryError
			? error.diagnostics.statusCode
			: undefined;
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
					error instanceof PushDeliveryError
						? (error.diagnostics.providerCode ?? "unknown")
						: "unknown",
				statusCode: String(status ?? "unknown"),
			},
			extra: { subscriptionId },
		},
	};
}

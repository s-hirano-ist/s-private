import { NotificationError } from "./errors.js";
import type {
	NotificationConfig,
	NotificationContext,
	NotificationService,
} from "./types.js";

/**
 * Pushover notification service implementation.
 *
 * @remarks
 * Implements the NotificationService interface using the Pushover API.
 * Messages are enriched with context information and sent with appropriate
 * priority levels based on the notification type.
 *
 * @internal
 */
class PushoverService implements NotificationService {
	constructor(private readonly config: NotificationConfig) {}

	/**
	 * Sends a message to the Pushover API.
	 *
	 * @param message - The message to send
	 * @param priority - The priority level (-1 = low, 0 = normal, 1 = high)
	 *
	 * @internal
	 */
	private async sendMessage(message: string, priority = 0): Promise<void> {
		try {
			const body = new URLSearchParams({
				token: this.config.appToken,
				user: this.config.userKey,
				message,
				priority: String(priority),
			});

			const result = await fetch(this.config.url, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body,
			});

			if (!result.ok) {
				throw new NotificationError();
			}
		} catch (error) {
			if (error instanceof NotificationError) {
				console.error(
					`[NotificationService] Failed to send notification: ${error.message}`,
				);
			} else {
				console.error(
					"[NotificationService] Unknown error occurred while sending notification:",
					error,
				);
			}
			// Don't throw here to prevent infinite loops in error handling
		}
	}

	async notifyError(
		message: string,
		context: NotificationContext,
	): Promise<void> {
		const enrichedMessage = `[ERROR] ${context.caller}: ${message}`;
		await this.sendMessage(enrichedMessage, 1); // High priority for errors
	}

	async notifyWarning(
		message: string,
		context: NotificationContext,
	): Promise<void> {
		const enrichedMessage = `[WARN] ${context.caller}: ${message}`;
		await this.sendMessage(enrichedMessage, 0); // Normal priority for warnings
	}

	async notifyInfo(
		message: string,
		context: NotificationContext,
	): Promise<void> {
		const enrichedMessage = `[INFO] ${context.caller}: ${message}`;
		await this.sendMessage(enrichedMessage, -1); // Low priority for info
	}
}

/**
 * Creates a new Pushover notification service instance.
 *
 * @remarks
 * Factory function for creating a NotificationService implementation
 * that uses the Pushover API for sending push notifications.
 *
 * The service enriches messages with context information and sends
 * notifications with appropriate priority levels:
 * - Error: Priority 1 (high) - triggers immediate notification
 * - Warning: Priority 0 (normal) - standard notification
 * - Info: Priority -1 (low) - silent notification
 *
 * @param config - The Pushover API configuration
 * @returns A NotificationService instance configured for Pushover
 *
 * @example
 * ```typescript
 * import { createPushoverService } from "@s-hirano-ist/s-notification";
 *
 * const notificationService = createPushoverService({
 *   url: "https://api.pushover.net/1/messages.json",
 *   userKey: process.env.PUSHOVER_USER_KEY,
 *   appToken: process.env.PUSHOVER_APP_TOKEN
 * });
 *
 * // Use the service to send notifications
 * await notificationService.notifyError("Server crash detected", {
 *   caller: "HealthCheck",
 *   userId: "admin"
 * });
 * ```
 *
 * @see {@link NotificationConfig} for configuration options
 * @see {@link NotificationService} for the service interface
 */
export function createPushoverService(
	config: NotificationConfig,
): NotificationService {
	return new PushoverService(config);
}

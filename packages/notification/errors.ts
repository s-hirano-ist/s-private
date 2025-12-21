/**
 * Error thrown when a notification fails to send.
 *
 * @remarks
 * This error is thrown when the Pushover API request fails or returns
 * a non-OK response. The error is caught internally by the notification
 * service to prevent infinite loops in error handling scenarios.
 *
 * @example
 * ```typescript
 * import { NotificationError } from "@s-hirano-ist/s-notification";
 *
 * try {
 *   await notificationService.notifyError("Test message", { caller: "Test" });
 * } catch (error) {
 *   if (error instanceof NotificationError) {
 *     console.error("Failed to send notification:", error.message);
 *   }
 * }
 * ```
 *
 * @see {@link createPushoverService} for the notification service factory
 */
export class NotificationError extends Error {
	constructor(message = "notificationSend") {
		super(message);
		this.name = "NotificationError";
	}
}

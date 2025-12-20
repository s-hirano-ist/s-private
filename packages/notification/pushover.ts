import { NotificationError } from "./errors";
import type {
	NotificationConfig,
	NotificationContext,
	NotificationService,
} from "./types";

class PushoverService implements NotificationService {
	constructor(private readonly config: NotificationConfig) {}

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

export function createPushoverService(
	config: NotificationConfig,
): NotificationService {
	return new PushoverService(config);
}

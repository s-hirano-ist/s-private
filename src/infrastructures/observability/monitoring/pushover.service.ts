import "server-only";
import { PushoverError } from "@/common/error/error-classes";
import { env } from "@/env";
import type {
	LogContext,
	MonitoringService,
} from "../logging/logger.interface";

class PushoverMonitoringService implements MonitoringService {
	private async sendMessage(message: string, priority = 0): Promise<void> {
		try {
			const PUSHOVER_API_URL = env.PUSHOVER_URL;
			const PUSHOVER_USER_KEY = env.PUSHOVER_USER_KEY;
			const PUSHOVER_APP_TOKEN = env.PUSHOVER_APP_TOKEN;

			const body = new URLSearchParams({
				token: PUSHOVER_APP_TOKEN,
				user: PUSHOVER_USER_KEY,
				message,
				priority: String(priority),
			});

			const result = await fetch(PUSHOVER_API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body,
			});

			if (!result.ok) {
				throw new PushoverError();
			}
		} catch (error) {
			if (error instanceof PushoverError) {
				console.error(
					`[PushoverService] Failed to send notification: ${error.message}`,
				);
			} else {
				console.error(
					"[PushoverService] Unknown error occurred while sending notification:",
					error,
				);
			}
			// Don't throw here to prevent infinite loops in error handling
		}
	}

	async notifyError(message: string, context: LogContext): Promise<void> {
		const enrichedMessage = `[ERROR] ${context.caller}: ${message}`;
		await this.sendMessage(enrichedMessage, 1); // High priority for errors
	}

	async notifyWarning(message: string, context: LogContext): Promise<void> {
		const enrichedMessage = `[WARN] ${context.caller}: ${message}`;
		await this.sendMessage(enrichedMessage, 0); // Normal priority for warnings
	}

	async notifyInfo(message: string, context: LogContext): Promise<void> {
		const enrichedMessage = `[INFO] ${context.caller}: ${message}`;
		await this.sendMessage(enrichedMessage, -1); // Low priority for info
	}
}

export const pushoverMonitoringService = new PushoverMonitoringService();

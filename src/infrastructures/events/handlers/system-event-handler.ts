import type {
	DomainEvent,
	DomainEventHandler,
} from "@/domains/common/events/domain-event.interface";
import type { LogContext } from "@/infrastructures/observability/logging/logger.interface";
import { serverLogger } from "@/infrastructures/observability/server";

export class SystemEventHandler implements DomainEventHandler {
	async handle(event: DomainEvent): Promise<void> {
		const { eventType, payload, metadata } = event;

		const context: LogContext = {
			caller: metadata.caller,
			status: payload.status as LogContext["status"],
			userId: metadata.userId,
		};

		const notifyOptions = payload.shouldNotify
			? { notify: payload.shouldNotify as boolean }
			: undefined;

		switch (eventType) {
			case "system.warning":
				serverLogger.warn(payload.message as string, context, notifyOptions);
				break;
			case "system.error":
				serverLogger.error(
					payload.message as string,
					context,
					payload.extraData,
					notifyOptions,
				);
				break;
			default:
				// This handler only processes system warning and error events
				break;
		}
	}
}

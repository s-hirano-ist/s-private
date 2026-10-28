import type { LogContext } from "@s-hirano-ist/s-application/observability/logger.interface";
import type { Logger } from "@s-hirano-ist/s-application/observability/logger.interface";
import type {
	DomainEvent,
	DomainEventHandler,
} from "@s-hirano-ist/s-core/shared-kernel/events/domain-event.interface";

export class SystemEventHandler implements DomainEventHandler {
	private logger: Logger;
	constructor(logger: Logger) {
		this.logger = logger;
	}
	async handle(event: DomainEvent): Promise<void> {
		const { eventType, payload, metadata } = event;

		const context: LogContext = {
			caller: metadata.caller,
			status: payload.status as LogContext["status"],
			userId: metadata.userId,
			...(eventType !== "system.warning" || payload.extraData === undefined
				? {}
				: { additionalContext: { extraData: payload.extraData } }),
		};

		const notifyOptions = payload.shouldNotify
			? { notify: payload.shouldNotify as boolean }
			: undefined;

		switch (eventType) {
			case "system.warning":
				await this.logger.warn(
					payload.message as string,
					context,
					notifyOptions,
				);
				break;
			case "system.error":
				await this.logger.error(
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

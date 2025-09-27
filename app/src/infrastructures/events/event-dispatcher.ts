import type {
	DomainEvent,
	DomainEventHandler,
} from "s-private-domains/common/events/domain-event.interface";

class EventDispatcher {
	private handlers: Map<string, DomainEventHandler[]> = new Map();

	register(eventType: string, handler: DomainEventHandler): void {
		if (!this.handlers.has(eventType)) {
			this.handlers.set(eventType, []);
		}
		this.handlers.get(eventType)?.push(handler);
	}

	unregister(eventType: string, handler: DomainEventHandler): void {
		const eventHandlers = this.handlers.get(eventType);
		if (eventHandlers) {
			const index = eventHandlers.indexOf(handler);
			if (index >= 0) {
				eventHandlers.splice(index, 1);
			}
		}
	}

	async dispatch(event: DomainEvent): Promise<void> {
		const eventHandlers = this.handlers.get(event.eventType);
		if (eventHandlers) {
			await Promise.all(eventHandlers.map((handler) => handler.handle(event)));
		}
	}
}

export const eventDispatcher = new EventDispatcher();

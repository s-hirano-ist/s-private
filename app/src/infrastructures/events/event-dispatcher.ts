/**
 * Domain event dispatcher infrastructure.
 *
 * @remarks
 * Implements the publish-subscribe pattern for domain events.
 * Handlers are registered per event type and invoked in parallel.
 *
 * @module
 */

import type {
	DomainEvent,
	DomainEventHandler,
} from "@s-hirano-ist/s-core/common/events/domain-event.interface";

/**
 * Central event dispatcher for domain events.
 *
 * @remarks
 * Manages event handler registration and dispatching.
 * All handlers for an event type are executed in parallel.
 */
class EventDispatcher {
	private handlers: Map<string, DomainEventHandler[]> = new Map();

	/**
	 * Registers a handler for a specific event type.
	 */
	register(eventType: string, handler: DomainEventHandler): void {
		if (!this.handlers.has(eventType)) {
			this.handlers.set(eventType, []);
		}
		this.handlers.get(eventType)?.push(handler);
	}

	/**
	 * Unregisters a handler for a specific event type.
	 */
	unregister(eventType: string, handler: DomainEventHandler): void {
		const eventHandlers = this.handlers.get(eventType);
		if (eventHandlers) {
			const index = eventHandlers.indexOf(handler);
			if (index >= 0) {
				eventHandlers.splice(index, 1);
			}
		}
	}

	/**
	 * Dispatches an event to all registered handlers.
	 */
	async dispatch(event: DomainEvent): Promise<void> {
		const eventHandlers = this.handlers.get(event.eventType);
		if (eventHandlers) {
			await Promise.all(eventHandlers.map((handler) => handler.handle(event)));
		}
	}
}

/**
 * Global event dispatcher singleton.
 *
 * @remarks
 * Use this instance to register handlers and dispatch domain events.
 */
export const eventDispatcher = new EventDispatcher();

import { DomainError, Result } from "../value-objects";
import type { DomainEvent } from "./domain-events";

// Event handler interface
export interface EventHandler<T extends DomainEvent = DomainEvent> {
	handle(event: T): Promise<Result<void, DomainError>>;
	eventType: T["eventType"];
}

// Event bus interface
export interface EventBus {
	publish(event: DomainEvent): Promise<Result<void, DomainError>>;
	publishMany(events: DomainEvent[]): Promise<Result<void, DomainError>>;
	subscribe<T extends DomainEvent>(
		eventType: T["eventType"],
		handler: EventHandler<T>,
	): void;
	unsubscribe<T extends DomainEvent>(
		eventType: T["eventType"],
		handler: EventHandler<T>,
	): void;
}

// In-memory event bus implementation
export class InMemoryEventBus implements EventBus {
	private handlers = new Map<string, EventHandler[]>();

	async publish(event: DomainEvent): Promise<Result<void, DomainError>> {
		const eventHandlers = this.handlers.get(event.eventType) || [];

		try {
			const results = await Promise.allSettled(
				eventHandlers.map((handler) => handler.handle(event)),
			);

			const failures = results
				.filter(
					(result): result is PromiseRejectedReason =>
						result.status === "rejected",
				)
				.map((result) => result.reason);

			if (failures.length > 0) {
				return Result.failure(
					DomainError.businessRule(
						`Failed to handle event: ${failures.map((f) => f.message).join(", ")}`,
						"event_handling_failed",
						{ eventType: event.eventType, eventId: event.id },
					),
				);
			}

			return Result.success(undefined);
		} catch (error) {
			return Result.failure(
				DomainError.businessRule(
					`Error publishing event: ${error instanceof Error ? error.message : "Unknown error"}`,
					"event_publish_failed",
					{ eventType: event.eventType, eventId: event.id },
				),
			);
		}
	}

	async publishMany(events: DomainEvent[]): Promise<Result<void, DomainError>> {
		const results = await Promise.allSettled(
			events.map((event) => this.publish(event)),
		);

		const failures = results
			.filter(
				(result): result is PromiseRejectedReason =>
					result.status === "rejected",
			)
			.map((result) => result.reason);

		if (failures.length > 0) {
			return Result.failure(
				DomainError.businessRule(
					`Failed to publish some events: ${failures.length} failures`,
					"batch_event_publish_failed",
					{ totalEvents: events.length, failures: failures.length },
				),
			);
		}

		return Result.success(undefined);
	}

	subscribe<T extends DomainEvent>(
		eventType: T["eventType"],
		handler: EventHandler<T>,
	): void {
		const eventHandlers = this.handlers.get(eventType) || [];
		eventHandlers.push(handler as EventHandler);
		this.handlers.set(eventType, eventHandlers);
	}

	unsubscribe<T extends DomainEvent>(
		eventType: T["eventType"],
		handler: EventHandler<T>,
	): void {
		const eventHandlers = this.handlers.get(eventType) || [];
		const index = eventHandlers.indexOf(handler as EventHandler);
		if (index > -1) {
			eventHandlers.splice(index, 1);
			this.handlers.set(eventType, eventHandlers);
		}
	}

	// For debugging/testing
	getHandlerCount(eventType: string): number {
		return this.handlers.get(eventType)?.length || 0;
	}

	getAllEventTypes(): string[] {
		return Array.from(this.handlers.keys());
	}
}

// Singleton event bus instance
export const eventBus = new InMemoryEventBus();

// Event publisher utility
export const EventPublisher = {
	publish: (event: DomainEvent) => eventBus.publish(event),
	publishMany: (events: DomainEvent[]) => eventBus.publishMany(events),
	subscribe: <T extends DomainEvent>(
		eventType: T["eventType"],
		handler: EventHandler<T>,
	) => eventBus.subscribe(eventType, handler),
	unsubscribe: <T extends DomainEvent>(
		eventType: T["eventType"],
		handler: EventHandler<T>,
	) => eventBus.unsubscribe(eventType, handler),
};

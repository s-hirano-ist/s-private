import type { BaseDomainEvent } from "./base-domain-event";

/**
 * Base interface for all domain events.
 *
 * @remarks
 * Domain events represent significant occurrences within the domain.
 * They are used for cross-cutting concerns like notifications, logging, and analytics.
 *
 * @example
 * ```typescript
 * const event: DomainEvent = {
 *   eventType: "article.created",
 *   payload: { title: "New Article", url: "https://example.com" },
 *   metadata: {
 *     timestamp: new Date(),
 *     caller: "addArticle",
 *     userId: "user-123"
 *   }
 * };
 * ```
 *
 * @see {@link BaseDomainEvent} for abstract base class
 * @see {@link DomainEventHandler} for handling events
 */
export type DomainEvent<
	TPayload extends Record<string, unknown> = Record<string, unknown>,
> = {
	/** The type of event (e.g., "article.created", "book.deleted") */
	eventType: string;
	/** Event-specific data */
	payload: TPayload;
	/** Contextual information about the event */
	metadata: {
		/** When the event occurred */
		timestamp: Date;
		/** The function/method that triggered the event */
		caller: string;
		/** The user who triggered the event */
		userId: string;
	};
};

/**
 * Interface for handling domain events.
 *
 * @remarks
 * Implement this interface to create event handlers for specific event types.
 * Handlers are typically used for side effects like sending notifications.
 *
 * @example
 * ```typescript
 * class ArticleCreatedHandler implements DomainEventHandler {
 *   async handle(event: DomainEvent): Promise<void> {
 *     if (event.eventType === "article.created") {
 *       await sendNotification(event.payload);
 *     }
 *   }
 * }
 * ```
 *
 * @see {@link DomainEvent} for the event structure
 */
export type DomainEventHandler = {
	/**
	 * Handles a domain event.
	 *
	 * @param event - The domain event to handle
	 */
	handle(event: DomainEvent<Record<string, unknown>>): Promise<void>;
};

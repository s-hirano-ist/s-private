import { BaseDomainEvent } from "../../common/events/base-domain-event";

/**
 * Domain event emitted when a book is deleted.
 *
 * @remarks
 * Part of the event-driven architecture for cross-cutting concerns
 * like notifications, logging, and analytics.
 *
 * @example
 * ```typescript
 * const event = new BookDeletedEvent({
 *   title: "Deleted Book",
 *   userId: "user-123",
 *   caller: "deleteBook",
 * });
 *
 * // event.eventType === "book.deleted"
 * await eventHandler.handle(event);
 * ```
 *
 * @see {@link BaseDomainEvent} for base class
 * @see {@link BookCreatedEvent} for creation event
 */
export class BookDeletedEvent extends BaseDomainEvent {
	/**
	 * Creates a new BookDeletedEvent.
	 *
	 * @param data - Event data containing deletion details
	 * @param data.title - The title of the deleted book
	 * @param data.userId - The user who deleted the book
	 * @param data.caller - The function/method that triggered the event
	 */
	constructor(data: {
		title: string;
		userId: string;
		caller: string;
	}) {
		super(
			"book.deleted",
			{
				title: data.title,
			},
			{
				caller: data.caller,
				userId: data.userId,
			},
		);
	}
}

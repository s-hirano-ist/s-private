import { BaseDomainEvent } from "../../common/events/base-domain-event";

/**
 * Domain event emitted when a book is created.
 *
 * @remarks
 * Part of the event-driven architecture for cross-cutting concerns
 * like notifications, logging, and analytics.
 *
 * @example
 * ```typescript
 * const event = new BookCreatedEvent({
 *   ISBN: "978-4-06-521234-5",
 *   title: "The Pragmatic Programmer",
 *   userId: "user-123",
 *   caller: "addBook",
 * });
 *
 * // event.eventType === "book.created"
 * await eventHandler.handle(event);
 * ```
 *
 * @see {@link BaseDomainEvent} for base class
 * @see {@link BookDeletedEvent} for deletion event
 */
export class BookCreatedEvent extends BaseDomainEvent {
	/**
	 * Creates a new BookCreatedEvent.
	 *
	 * @param data - Event data containing book details and metadata
	 * @param data.ISBN - The book's ISBN identifier
	 * @param data.title - The book title
	 * @param data.userId - The user who created the book
	 * @param data.caller - The function/method that triggered the event
	 */
	constructor(data: {
		ISBN: string;
		title: string;
		userId: string;
		caller: string;
	}) {
		super(
			"book.created",
			{
				ISBN: data.ISBN,
				title: data.title,
			},
			{
				caller: data.caller,
				userId: data.userId,
			},
		);
	}
}

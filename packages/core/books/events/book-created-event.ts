import type { BookDeletedEvent } from "@s-hirano-ist/s-core/books/events/book-deleted-event";
import type { BookCreatedPayload } from "@s-hirano-ist/s-core/shared-kernel/events/payload-types";
import { BaseDomainEvent } from "@s-hirano-ist/s-core/shared-kernel/events/base-domain-event";

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
 *   isbn: "978-4-06-521234-5",
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
export class BookCreatedEvent extends BaseDomainEvent<BookCreatedPayload> {
	/**
	 * Creates a new BookCreatedEvent.
	 *
	 * @param data - Event data containing book details and metadata
	 * @param data.isbn - The book's ISBN identifier
	 * @param data.title - The book title
	 * @param data.userId - The user who created the book
	 * @param data.caller - The function/method that triggered the event
	 */
	constructor(data: {
		caller: string;
		isbn: string;
		title: string;
		userId: string;
	}) {
		super(
			"book.created",
			{
				isbn: data.isbn,
				title: data.title,
			},
			{
				caller: data.caller,
				userId: data.userId,
			},
		);
	}
}

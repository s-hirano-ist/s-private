import { BaseDomainEvent } from "../../common/events/base-domain-event";

/**
 * Domain event emitted when a note is created.
 *
 * @remarks
 * Part of the event-driven architecture for cross-cutting concerns
 * like notifications, logging, and analytics.
 *
 * @example
 * ```typescript
 * const event = new NoteCreatedEvent({
 *   title: "Meeting Notes",
 *   markdown: "# Meeting Notes\n\n- Item 1",
 *   userId: "user-123",
 *   caller: "addNote",
 * });
 *
 * // event.eventType === "note.created"
 * await eventHandler.handle(event);
 * ```
 *
 * @see {@link BaseDomainEvent} for base class
 * @see {@link NoteDeletedEvent} for deletion event
 */
export class NoteCreatedEvent extends BaseDomainEvent {
	/**
	 * Creates a new NoteCreatedEvent.
	 *
	 * @param data - Event data containing note details and metadata
	 * @param data.title - The note title
	 * @param data.markdown - The markdown content
	 * @param data.userId - The user who created the note
	 * @param data.caller - The function/method that triggered the event
	 */
	constructor(data: {
		title: string;
		markdown: string;
		userId: string;
		caller: string;
	}) {
		super(
			"note.created",
			{
				title: data.title,
				markdown: data.markdown,
			},
			{
				caller: data.caller,
				userId: data.userId,
			},
		);
	}
}

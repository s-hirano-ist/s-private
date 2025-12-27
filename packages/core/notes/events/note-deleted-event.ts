import { BaseDomainEvent } from "../../common/events/base-domain-event.js";

/**
 * Domain event emitted when a note is deleted.
 *
 * @remarks
 * Part of the event-driven architecture for cross-cutting concerns
 * like notifications, logging, and analytics.
 *
 * @example
 * ```typescript
 * const event = new NoteDeletedEvent({
 *   title: "Deleted Note",
 *   userId: "user-123",
 *   caller: "deleteNote",
 * });
 *
 * // event.eventType === "note.deleted"
 * await eventHandler.handle(event);
 * ```
 *
 * @see {@link BaseDomainEvent} for base class
 * @see {@link NoteCreatedEvent} for creation event
 */
export class NoteDeletedEvent extends BaseDomainEvent {
	/**
	 * Creates a new NoteDeletedEvent.
	 *
	 * @param data - Event data containing deletion details
	 * @param data.title - The title of the deleted note
	 * @param data.userId - The user who deleted the note
	 * @param data.caller - The function/method that triggered the event
	 */
	constructor(data: {
		title: string;
		userId: string;
		caller: string;
	}) {
		super(
			"note.deleted",
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

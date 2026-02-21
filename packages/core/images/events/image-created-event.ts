import { BaseDomainEvent } from "../../shared-kernel/events/base-domain-event.ts";
import type { ImageCreatedPayload } from "../../shared-kernel/events/payload-types.ts";
import type { ImageDeletedEvent } from "./image-deleted-event.ts";

/**
 * Domain event emitted when an image is created.
 *
 * @remarks
 * Part of the event-driven architecture for cross-cutting concerns
 * like notifications, logging, and analytics.
 *
 * @example
 * ```typescript
 * const event = new ImageCreatedEvent({
 *   id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b",
 *   path: "image.jpg",
 *   userId: "user-123",
 *   caller: "addImage",
 * });
 *
 * // event.eventType === "image.created"
 * await eventHandler.handle(event);
 * ```
 *
 * @see {@link BaseDomainEvent} for base class
 * @see {@link ImageDeletedEvent} for deletion event
 */
export class ImageCreatedEvent extends BaseDomainEvent<ImageCreatedPayload> {
	/**
	 * Creates a new ImageCreatedEvent.
	 *
	 * @param data - Event data containing image details and metadata
	 * @param data.id - The image ID
	 * @param data.path - The image storage path
	 * @param data.userId - The user who created the image
	 * @param data.caller - The function/method that triggered the event
	 */
	constructor(data: {
		id: string;
		path: string;
		userId: string;
		caller: string;
	}) {
		super(
			"image.created",
			{
				id: data.id,
				path: data.path,
			},
			{
				caller: data.caller,
				userId: data.userId,
			},
		);
	}
}

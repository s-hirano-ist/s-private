import { BaseDomainEvent } from "../../shared-kernel/events/base-domain-event.ts";
import type { ImageDeletedPayload } from "../../shared-kernel/events/payload-types.ts";
import type { ImageCreatedEvent } from "./image-created-event.ts";

/**
 * Domain event emitted when an image is deleted.
 *
 * @remarks
 * Part of the event-driven architecture for cross-cutting concerns
 * like notifications, logging, and analytics.
 *
 * @example
 * ```typescript
 * const event = new ImageDeletedEvent({
 *   path: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b-image.jpg",
 *   userId: "user-123",
 *   caller: "deleteImage",
 * });
 *
 * // event.eventType === "image.deleted"
 * await eventHandler.handle(event);
 * ```
 *
 * @see {@link BaseDomainEvent} for base class
 * @see {@link ImageCreatedEvent} for creation event
 */
export class ImageDeletedEvent extends BaseDomainEvent<ImageDeletedPayload> {
	/**
	 * Creates a new ImageDeletedEvent.
	 *
	 * @param data - Event data containing deletion details
	 * @param data.path - The storage path of the deleted image
	 * @param data.userId - The user who deleted the image
	 * @param data.caller - The function/method that triggered the event
	 */
	constructor(data: {
		path: string;
		userId: string;
		caller: string;
	}) {
		super(
			"image.deleted",
			{
				path: data.path,
			},
			{
				caller: data.caller,
				userId: data.userId,
			},
		);
	}
}

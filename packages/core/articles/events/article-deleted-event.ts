import { BaseDomainEvent } from "../../shared-kernel/events/base-domain-event.js";
import type { ArticleCreatedEvent } from "./article-created-event.js";

/**
 * Domain event emitted when an article is deleted.
 *
 * @remarks
 * Part of the event-driven architecture for cross-cutting concerns
 * like notifications, logging, and analytics.
 *
 * @example
 * ```typescript
 * const event = new ArticleDeletedEvent({
 *   title: "Deleted Article",
 *   userId: "user-123",
 *   caller: "deleteArticle",
 * });
 *
 * // event.eventType === "article.deleted"
 * await eventHandler.handle(event);
 * ```
 *
 * @see {@link BaseDomainEvent} for base class
 * @see {@link ArticleCreatedEvent} for creation event
 */
export class ArticleDeletedEvent extends BaseDomainEvent {
	/**
	 * Creates a new ArticleDeletedEvent.
	 *
	 * @param data - Event data containing deletion details
	 * @param data.title - The title of the deleted article
	 * @param data.userId - The user who deleted the article
	 * @param data.caller - The function/method that triggered the event
	 */
	constructor(data: {
		title: string;
		userId: string;
		caller: string;
	}) {
		super(
			"article.deleted",
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

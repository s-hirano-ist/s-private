import { BaseDomainEvent } from "../../common/events/base-domain-event";

/**
 * Domain event emitted when an article is created.
 *
 * @remarks
 * Part of the event-driven architecture for cross-cutting concerns
 * like notifications, logging, and analytics.
 *
 * @example
 * ```typescript
 * const event = new ArticleCreatedEvent({
 *   title: "New Article",
 *   url: "https://example.com",
 *   quote: "Important quote",
 *   categoryName: "Technology",
 *   userId: "user-123",
 *   caller: "addArticle",
 * });
 *
 * // event.eventType === "article.created"
 * await eventHandler.handle(event);
 * ```
 *
 * @see {@link BaseDomainEvent} for base class
 * @see {@link ArticleDeletedEvent} for deletion event
 */
export class ArticleCreatedEvent extends BaseDomainEvent {
	/**
	 * Creates a new ArticleCreatedEvent.
	 *
	 * @param data - Event data containing article details and metadata
	 * @param data.title - The article title
	 * @param data.url - The article URL
	 * @param data.quote - Quote/excerpt from the article
	 * @param data.categoryName - The category name
	 * @param data.userId - The user who created the article
	 * @param data.caller - The function/method that triggered the event
	 */
	constructor(data: {
		title: string;
		url: string;
		quote: string;
		categoryName: string;
		userId: string;
		caller: string;
	}) {
		super(
			"article.created",
			{
				title: data.title,
				url: data.url,
				quote: data.quote,
				categoryName: data.categoryName,
			},
			{
				caller: data.caller,
				userId: data.userId,
			},
		);
	}
}

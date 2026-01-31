import type { DomainEvent } from "./domain-event.interface";

/**
 * Abstract base class for all domain events.
 *
 * @remarks
 * Provides common functionality for domain events including automatic
 * timestamp generation. Extend this class to create specific event types.
 *
 * @typeParam TPayload - The type of the event payload
 *
 * @example
 * ```typescript
 * type ArticleCreatedPayload = { title: string; url: string };
 *
 * class ArticleCreatedEvent extends BaseDomainEvent<ArticleCreatedPayload> {
 *   constructor(data: { title: string; url: string; userId: string; caller: string }) {
 *     super(
 *       "article.created",
 *       { title: data.title, url: data.url },
 *       { caller: data.caller, userId: data.userId }
 *     );
 *   }
 * }
 * ```
 *
 * @see {@link DomainEvent} for the interface
 */
export abstract class BaseDomainEvent<TPayload extends Record<string, unknown>>
	implements DomainEvent<TPayload>
{
	/** The type of event (e.g., "article.created") */
	public readonly eventType: string;

	/** Event-specific data */
	public readonly payload: TPayload;

	/** Contextual information about the event */
	public readonly metadata: {
		timestamp: Date;
		caller: string;
		userId: string;
	};

	/**
	 * Creates a new domain event.
	 *
	 * @param eventType - The type identifier for the event
	 * @param payload - Event-specific data
	 * @param metadata - Contextual information (timestamp is auto-generated)
	 */
	constructor(
		eventType: string,
		payload: TPayload,
		metadata: {
			caller: string;
			userId: string;
		},
	) {
		this.eventType = eventType;
		this.payload = payload;
		this.metadata = {
			...metadata,
			timestamp: new Date(),
		};
	}
}

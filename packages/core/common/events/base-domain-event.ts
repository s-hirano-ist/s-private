import type { DomainEvent } from "./domain-event.interface.js";

/**
 * Abstract base class for all domain events.
 *
 * @remarks
 * Provides common functionality for domain events including automatic
 * timestamp generation. Extend this class to create specific event types.
 *
 * @example
 * ```typescript
 * class ArticleCreatedEvent extends BaseDomainEvent {
 *   constructor(data: { title: string; userId: string; caller: string }) {
 *     super(
 *       "article.created",
 *       { title: data.title },
 *       { caller: data.caller, userId: data.userId }
 *     );
 *   }
 * }
 * ```
 *
 * @see {@link DomainEvent} for the interface
 */
export abstract class BaseDomainEvent implements DomainEvent {
	/** The type of event (e.g., "article.created") */
	public readonly eventType: string;

	/** Event-specific data */
	public readonly payload: Record<string, unknown>;

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
		payload: Record<string, unknown>,
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

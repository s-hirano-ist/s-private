/**
 * Payload type definitions for all domain events.
 *
 * @remarks
 * These types define the structure of event payloads using plain string types
 * instead of Branded Types. Events represent validated snapshots of data,
 * so the type safety at creation time is sufficient.
 *
 * @module
 */

// ============================================================================
// System Events
// ============================================================================

/**
 * Payload for system error events.
 *
 * @see {@link SystemErrorEvent}
 */
export type SystemErrorPayload = {
	message: string;
	status: number;
	extraData?: unknown;
	shouldNotify: boolean;
};

/**
 * Payload for system warning events.
 *
 * @see {@link SystemWarningEvent}
 */
export type SystemWarningPayload = {
	message: string;
	status: number;
	extraData?: unknown;
	shouldNotify: boolean;
};

// ============================================================================
// Article Events
// ============================================================================

/**
 * Payload for article created events.
 *
 * @see {@link ArticleCreatedEvent}
 */
export type ArticleCreatedPayload = {
	title: string;
	url: string;
	quote: string;
	categoryName: string;
};

/**
 * Payload for article deleted events.
 *
 * @see {@link ArticleDeletedEvent}
 */
export type ArticleDeletedPayload = {
	title: string;
};

// ============================================================================
// Note Events
// ============================================================================

/**
 * Payload for note created events.
 *
 * @see {@link NoteCreatedEvent}
 */
export type NoteCreatedPayload = {
	title: string;
	markdown: string;
};

/**
 * Payload for note deleted events.
 *
 * @see {@link NoteDeletedEvent}
 */
export type NoteDeletedPayload = {
	title: string;
};

// ============================================================================
// Image Events
// ============================================================================

/**
 * Payload for image created events.
 *
 * @see {@link ImageCreatedEvent}
 */
export type ImageCreatedPayload = {
	id: string;
	path: string;
};

/**
 * Payload for image deleted events.
 *
 * @see {@link ImageDeletedEvent}
 */
export type ImageDeletedPayload = {
	path: string;
};

// ============================================================================
// Book Events
// ============================================================================

/**
 * Payload for book created events.
 *
 * @see {@link BookCreatedEvent}
 */
export type BookCreatedPayload = {
	isbn: string;
	title: string;
};

/**
 * Payload for book deleted events.
 *
 * @see {@link BookDeletedEvent}
 */
export type BookDeletedPayload = {
	title: string;
};

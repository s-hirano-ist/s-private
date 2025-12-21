import { BaseDomainEvent } from "./base-domain-event";

/**
 * Domain event for system errors.
 *
 * @remarks
 * Used to track and notify about system-level errors.
 * The shouldNotify flag controls whether external notifications (e.g., Pushover) are sent.
 *
 * @example
 * ```typescript
 * const event = new SystemErrorEvent({
 *   message: "Database connection failed",
 *   status: 500,
 *   caller: "connectDatabase",
 *   userId: "system",
 *   shouldNotify: true,
 *   extraData: { host: "localhost", port: 5432 }
 * });
 *
 * // event.eventType === "system.error"
 * await eventHandler.handle(event);
 * ```
 *
 * @see {@link SystemWarningEvent} for non-critical issues
 * @see {@link BaseDomainEvent} for base class
 */
export class SystemErrorEvent extends BaseDomainEvent {
	/**
	 * Creates a new system error event.
	 *
	 * @param data - Error event data
	 * @param data.message - Human-readable error message
	 * @param data.status - HTTP status code representing the error severity
	 * @param data.caller - The function/method where the error occurred
	 * @param data.userId - The user affected (defaults to "system")
	 * @param data.extraData - Additional context about the error
	 * @param data.shouldNotify - Whether to send external notifications (defaults to false)
	 */
	constructor(data: {
		message: string;
		status: number;
		caller: string;
		userId?: string;
		extraData?: unknown;
		shouldNotify?: boolean;
	}) {
		super(
			"system.error",
			{
				message: data.message,
				status: data.status,
				extraData: data.extraData,
				shouldNotify: data.shouldNotify ?? false,
			},
			{
				caller: data.caller,
				userId: data.userId ?? "system",
			},
		);
	}
}

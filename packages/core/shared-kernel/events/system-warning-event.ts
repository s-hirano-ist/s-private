import { BaseDomainEvent } from "./base-domain-event.js";
import type { SystemWarningPayload } from "./payload-types.js";
import type { SystemErrorEvent } from "./system-error-event.js";

/**
 * Domain event for system warnings.
 *
 * @remarks
 * Used to track non-critical issues that don't require immediate action.
 * The shouldNotify flag controls whether external notifications are sent.
 *
 * @example
 * ```typescript
 * const event = new SystemWarningEvent({
 *   message: "Cache miss rate above threshold",
 *   status: 200,
 *   caller: "cacheService",
 *   shouldNotify: false,
 *   extraData: { missRate: 0.75 }
 * });
 *
 * // event.eventType === "system.warning"
 * await eventHandler.handle(event);
 * ```
 *
 * @see {@link SystemErrorEvent} for critical errors
 * @see {@link BaseDomainEvent} for base class
 */
export class SystemWarningEvent extends BaseDomainEvent<SystemWarningPayload> {
	/**
	 * Creates a new system warning event.
	 *
	 * @param data - Warning event data
	 * @param data.message - Human-readable warning message
	 * @param data.status - HTTP status code (typically 2xx for warnings)
	 * @param data.caller - The function/method where the warning occurred
	 * @param data.userId - The user affected (defaults to "system")
	 * @param data.extraData - Additional context about the warning
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
			"system.warning",
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

import type { SystemWarningPayload } from "@s-hirano-ist/s-infrastructure/observability/events/payload-types";
import type { SystemErrorEvent } from "@s-hirano-ist/s-infrastructure/observability/events/system-error-event";
import { BaseDomainEvent } from "@s-hirano-ist/s-core/shared-kernel/events/base-domain-event";

/**
 * Domain event for system warnings.
 *
 * @remarks
 * Used to track non-critical issues that don't require immediate action.
 *
 * @example
 * ```typescript
 * const event = new SystemWarningEvent({
 *   message: "Cache miss rate above threshold",
 *   status: 200,
 *   caller: "cacheService",
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
	 */
	constructor(data: {
		caller: string;
		extraData?: unknown;
		message: string;
		status: number;
		userId?: string;
	}) {
		super(
			"system.warning",
			{
				message: data.message,
				status: data.status,
				extraData: data.extraData,
			},
			{
				caller: data.caller,
				userId: data.userId ?? "system",
			},
		);
	}
}

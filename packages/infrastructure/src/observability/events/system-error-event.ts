import type { SystemErrorPayload } from "@s-hirano-ist/s-infrastructure/observability/events/payload-types";
import type { SystemWarningEvent } from "@s-hirano-ist/s-infrastructure/observability/events/system-warning-event";
import { BaseDomainEvent } from "@s-hirano-ist/s-core/shared-kernel/events/base-domain-event";

/**
 * Domain event for system errors.
 *
 * @remarks
 * Used to track and notify about system-level errors.
 * Critical severity sends an additional Pushover notification.
 *
 * @example
 * ```typescript
 * const event = new SystemErrorEvent({
 *   message: "Database connection failed",
 *   status: 500,
 *   caller: "connectDatabase",
 *   userId: "system",
 *   severity: "critical",
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
export class SystemErrorEvent extends BaseDomainEvent<SystemErrorPayload> {
	/**
	 * Creates a new system error event.
	 *
	 * @param data - Error event data
	 * @param data.message - Human-readable error message
	 * @param data.status - HTTP status code representing the error severity
	 * @param data.caller - The function/method where the error occurred
	 * @param data.userId - The user affected (defaults to "system")
	 * @param data.extraData - Additional context about the error
	 * @param data.severity - Error severity (defaults to normal)
	 */
	constructor(data: {
		caller: string;
		extraData?: unknown;
		message: string;
		severity?: "normal" | "critical";
		status: number;
		userId?: string;
	}) {
		super(
			"system.error",
			{
				message: data.message,
				status: data.status,
				extraData: data.extraData,
				severity: data.severity ?? "normal",
			},
			{
				caller: data.caller,
				userId: data.userId ?? "system",
			},
		);
	}
}

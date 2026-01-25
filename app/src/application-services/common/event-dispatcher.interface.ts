/**
 * Event dispatcher interface for dependency injection.
 *
 * @remarks
 * This interface is shared across all domains to avoid cross-domain imports.
 * It defines the contract for dispatching domain events.
 *
 * @module
 */

import type { DomainEvent } from "@s-hirano-ist/s-core/shared-kernel/events/domain-event.interface";

/**
 * Event dispatcher interface for dependency injection.
 */
export type IEventDispatcher = {
	dispatch(event: DomainEvent): Promise<void>;
};

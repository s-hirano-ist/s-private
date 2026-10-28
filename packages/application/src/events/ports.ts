import type { DomainEvent } from "@s-hirano-ist/s-core/shared-kernel/events/domain-event.interface";
export type EventDispatcher = { dispatch(event: DomainEvent): Promise<void> };

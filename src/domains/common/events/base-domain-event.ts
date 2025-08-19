import type { DomainEvent } from "./domain-event.interface";

export abstract class BaseDomainEvent implements DomainEvent {
	public readonly eventType: string;
	public readonly payload: Record<string, unknown>;
	public readonly metadata: {
		timestamp: Date;
		caller: string;
		userId: string;
	};

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

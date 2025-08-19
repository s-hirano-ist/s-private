export type DomainEvent = {
	eventType: string;
	payload: Record<string, unknown>;
	metadata: {
		timestamp: Date;
		caller: string;
		userId: string;
	};
};

export type DomainEventHandler = {
	handle(event: DomainEvent): Promise<void>;
};

export type PushSubscription = {
	auth: string;
	endpoint: string;
	id: string;
	p256dh: string;
	userId: string;
};

export type PushSubscriptionRepository = {
	deleteByIds(ids: string[]): Promise<void>;
	deleteOwned(userId: string, endpoint: string): Promise<void>;
	findByEndpoint(endpoint: string): Promise<PushSubscription | null>;
	findOwned(userId: string, endpoint: string): Promise<PushSubscription | null>;
	listAll(): Promise<PushSubscription[]>;
	save(
		userId: string,
		endpoint: string,
		auth: string,
		p256dh: string,
	): Promise<void>;
};

type Action = {
	message: string;
	success: boolean;
};

export type ServerAction<T> =
	| (Action & { data: T; success: true })
	| (Action & { success: false });

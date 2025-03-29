type Action = {
	message: string;
	success: boolean;
};

export type ServerAction<T> =
	| (Action & { data: T; success: true })
	| (Action & { success: false });

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

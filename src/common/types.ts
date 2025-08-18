export type ServerAction = {
	message: string;
	success: boolean;
	formData?: Record<string, string>;
};

export type ServerActionWithData<T> = ServerAction & {
	data?: T;
};

export type DeleteAction = (id: string) => Promise<ServerAction>;

export type LoadMoreAction<T> = (
	currentCount: number,
) => Promise<ServerActionWithData<T>>;

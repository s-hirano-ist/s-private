export type ServerAction = {
	message: string;
	success: boolean;
	formData?: Record<string, string>;
};

export type ServerActionWithData<T> = ServerAction & {
	data?: T;
};

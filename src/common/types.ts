export type ServerAction = {
	message: string;
	success: boolean;
	formData?: Record<string, string>;
};

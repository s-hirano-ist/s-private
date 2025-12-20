export type NotificationConfig = {
	url: string;
	userKey: string;
	appToken: string;
};

export type NotificationContext = {
	caller: string;
	userId?: string;
};

export type NotificationService = {
	notifyError(message: string, context: NotificationContext): Promise<void>;
	notifyWarning(message: string, context: NotificationContext): Promise<void>;
	notifyInfo(message: string, context: NotificationContext): Promise<void>;
};

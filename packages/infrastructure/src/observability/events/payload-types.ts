export type SystemErrorPayload = {
	extraData?: unknown;
	message: string;
	shouldNotify: boolean;
	status: number;
};
export type SystemWarningPayload = {
	extraData?: unknown;
	message: string;
	shouldNotify: boolean;
	status: number;
};

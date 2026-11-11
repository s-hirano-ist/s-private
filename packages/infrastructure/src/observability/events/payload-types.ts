export type SystemErrorPayload = {
	extraData?: unknown;
	message: string;
	severity: "normal" | "critical";
	status: number;
};
export type SystemWarningPayload = {
	extraData?: unknown;
	message: string;
	status: number;
};

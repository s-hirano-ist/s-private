import {
	createPushoverService,
	type NotificationService,
} from "@s-hirano-ist/s-notification";
export type PushoverConfig = {
	LOCAL_DEV_MODE: "true" | "false";
	PUSHOVER_APP_TOKEN?: string;
	PUSHOVER_URL: string;
	PUSHOVER_USER_KEY?: string;
	VERCEL?: string;
};
export function createBackendNotificationService(
	env: PushoverConfig,
): NotificationService {
	if (env.LOCAL_DEV_MODE === "true" && env.VERCEL !== "1")
		return {
			notifyError: () => Promise.resolve(),
			notifyInfo: () => Promise.resolve(),
			notifyWarning: () => Promise.resolve(),
		};
	return createPushoverService({
		url: env.PUSHOVER_URL,
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});
}

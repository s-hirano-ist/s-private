import { createPushoverService } from "@s-hirano-ist/s-notification";
import type { BaseEnv } from "./env.js";

export function getNotificationService(env: BaseEnv) {
	return createPushoverService({
		url: env.PUSHOVER_URL,
		userKey: env.PUSHOVER_USER_KEY,
		appToken: env.PUSHOVER_APP_TOKEN,
	});
}

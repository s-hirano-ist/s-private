// Server-side infrastructure exports
export * from "./logging/logger.interface";

// Create serverLogger instance with dependency injection
import { createPushoverService } from "@s-hirano-ist/s-notification";
import { env } from "@/env";
import { ServerLogger } from "./logging/server-logger";

const notificationService = createPushoverService({
	url: env.PUSHOVER_URL,
	userKey: env.PUSHOVER_USER_KEY,
	appToken: env.PUSHOVER_APP_TOKEN,
});

export const serverLogger = new ServerLogger(notificationService);

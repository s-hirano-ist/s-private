export * from "./logging/logger.interface";
import { env } from "@/env";
import { createBackendNotificationService } from "@s-hirano-ist/s-backend/notifications/pushover-service";
import { ServerLogger } from "./logging/server-logger";
export const serverLogger = new ServerLogger(
	createBackendNotificationService(env),
);

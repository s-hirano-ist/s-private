// Server-side infrastructure exports
export * from "./logging/logger.interface";
export * from "./monitoring/pushover.service";

// Create serverLogger instance with dependency injection
import { ServerLogger } from "./logging/server-logger";
import { pushoverMonitoringService } from "./monitoring/pushover.service";

export const serverLogger = new ServerLogger(pushoverMonitoringService);

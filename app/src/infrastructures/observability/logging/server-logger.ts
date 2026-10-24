import type { NotificationService } from "@s-hirano-ist/s-notification";
import { ServerLogger as BackendLogger } from "@s-hirano-ist/s-backend/observability/server-logger";
import * as Sentry from "@sentry/nextjs";
export class ServerLogger extends BackendLogger {
	constructor(notificationService: NotificationService) {
		super(notificationService, Sentry);
	}
}

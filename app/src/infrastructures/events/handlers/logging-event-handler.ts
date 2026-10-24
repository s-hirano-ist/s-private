import { serverLogger } from "@/infrastructures/observability/server";
import { LoggingEventHandler as BackendHandler } from "@s-hirano-ist/s-backend/events/logging-event-handler";
export class LoggingEventHandler extends BackendHandler {
	constructor() {
		super(serverLogger);
	}
}

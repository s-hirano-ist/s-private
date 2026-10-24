import { serverLogger } from "@/infrastructures/observability/server";
import { SystemEventHandler as BackendHandler } from "@s-hirano-ist/s-backend/events/system-event-handler";
export class SystemEventHandler extends BackendHandler {
	constructor() {
		super(serverLogger);
	}
}

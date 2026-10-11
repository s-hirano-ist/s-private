import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { LoggingEventHandler } from "@/infrastructures/events/handlers/logging-event-handler";
import { SystemEventHandler } from "@/infrastructures/events/handlers/system-event-handler";
import { createEventInitializer } from "@s-hirano-ist/s-backend/events/event-setup";
let initialize: (() => void) | undefined;
export function initializeEventHandlers(): void {
	initialize ??= createEventInitializer(eventDispatcher, {
		logging: new LoggingEventHandler(),
		system: new SystemEventHandler(),
	});
	initialize();
}

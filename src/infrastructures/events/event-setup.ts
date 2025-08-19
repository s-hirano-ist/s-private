import { eventDispatcher } from "./event-dispatcher";
import { LoggingEventHandler } from "./handlers/logging-event-handler";
import { SystemEventHandler } from "./handlers/system-event-handler";

let isInitialized = false;

export function initializeEventHandlers(): void {
	if (isInitialized) return;

	const loggingHandler = new LoggingEventHandler();
	const systemHandler = new SystemEventHandler();

	eventDispatcher.register("article.created", loggingHandler);
	eventDispatcher.register("article.deleted", loggingHandler);
	eventDispatcher.register("note.created", loggingHandler);
	eventDispatcher.register("note.deleted", loggingHandler);
	eventDispatcher.register("image.created", loggingHandler);
	eventDispatcher.register("image.deleted", loggingHandler);
	eventDispatcher.register("book.created", loggingHandler);
	eventDispatcher.register("book.deleted", loggingHandler);

	eventDispatcher.register("system.warning", systemHandler);
	eventDispatcher.register("system.error", systemHandler);

	isInitialized = true;
}

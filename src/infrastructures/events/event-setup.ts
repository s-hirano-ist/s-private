import { eventDispatcher } from "./event-dispatcher";
import { LoggingEventHandler } from "./handlers/logging-event-handler";

let isInitialized = false;

export function initializeEventHandlers(): void {
	if (isInitialized) return;

	const loggingHandler = new LoggingEventHandler();

	eventDispatcher.register("article.created", loggingHandler);
	eventDispatcher.register("article.deleted", loggingHandler);
	eventDispatcher.register("note.created", loggingHandler);
	eventDispatcher.register("note.deleted", loggingHandler);
	eventDispatcher.register("image.created", loggingHandler);
	eventDispatcher.register("image.deleted", loggingHandler);
	eventDispatcher.register("book.created", loggingHandler);
	eventDispatcher.register("book.deleted", loggingHandler);

	isInitialized = true;
}

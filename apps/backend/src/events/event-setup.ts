import type { DomainEventHandler } from "@s-hirano-ist/s-core/shared-kernel/events/domain-event.interface";
import type { EventDispatcher } from "s-private-backend/events/event-dispatcher";
export function createEventInitializer(
	eventDispatcher: Pick<EventDispatcher, "register">,
	handlers: { logging: DomainEventHandler; system: DomainEventHandler },
) {
	let isInitialized = false;

	function initializeEventHandlers(): void {
		if (isInitialized) return;

		const loggingHandler = handlers.logging;
		const systemHandler = handlers.system;

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

	return initializeEventHandlers;
}

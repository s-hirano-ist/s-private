import type {
	DomainEvent,
	DomainEventHandler,
} from "@s-hirano-ist/s-core/shared-kernel/events/domain-event.interface";
import { describe, expect, test, vi } from "vitest";
import { eventDispatcher } from "./event-dispatcher";

describe("EventDispatcher", () => {
	const createMockHandler = (): DomainEventHandler => ({
		handle: vi.fn().mockResolvedValue(undefined),
	});

	const createMockEvent = (eventType: string): DomainEvent => ({
		eventType,
		payload: { message: "test" },
		metadata: {
			timestamp: new Date(),
			caller: "test",
			userId: "user-123",
		},
	});

	test("should dispatch event to registered handler", async () => {
		const handler = createMockHandler();
		const event = createMockEvent("test.dispatch");

		eventDispatcher.register("test.dispatch", handler);

		await eventDispatcher.dispatch(event);

		expect(handler.handle).toHaveBeenCalledTimes(1);
		expect(handler.handle).toHaveBeenCalledWith(event);

		eventDispatcher.unregister("test.dispatch", handler);
	});

	test("should dispatch event to multiple registered handlers", async () => {
		const handler1 = createMockHandler();
		const handler2 = createMockHandler();
		const event = createMockEvent("test.multiple");

		eventDispatcher.register("test.multiple", handler1);
		eventDispatcher.register("test.multiple", handler2);

		await eventDispatcher.dispatch(event);

		expect(handler1.handle).toHaveBeenCalledTimes(1);
		expect(handler2.handle).toHaveBeenCalledTimes(1);

		eventDispatcher.unregister("test.multiple", handler1);
		eventDispatcher.unregister("test.multiple", handler2);
	});

	test("should not call handler after unregister", async () => {
		const handler = createMockHandler();
		const event = createMockEvent("test.unregister");

		eventDispatcher.register("test.unregister", handler);
		eventDispatcher.unregister("test.unregister", handler);

		await eventDispatcher.dispatch(event);

		expect(handler.handle).not.toHaveBeenCalled();
	});

	test("should not error when dispatching event with no registered handlers", async () => {
		const event = createMockEvent("test.no-handlers");
		await expect(eventDispatcher.dispatch(event)).resolves.toBeUndefined();
	});

	test("should only dispatch to handlers of matching event type", async () => {
		const handler = createMockHandler();
		const event = createMockEvent("test.other-type");

		eventDispatcher.register("test.specific-type", handler);

		await eventDispatcher.dispatch(event);

		expect(handler.handle).not.toHaveBeenCalled();

		eventDispatcher.unregister("test.specific-type", handler);
	});
});

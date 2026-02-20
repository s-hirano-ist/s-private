import type { DomainEvent } from "@s-hirano-ist/s-core/shared-kernel/events/domain-event.interface";
import { describe, expect, test } from "vitest";
import { serverLogger } from "@/infrastructures/observability/server";
import { SystemEventHandler } from "./system-event-handler";

describe("SystemEventHandler", () => {
	const handler = new SystemEventHandler();

	const createEvent = (
		eventType: string,
		payload: Record<string, unknown>,
	): DomainEvent => ({
		eventType,
		payload,
		metadata: {
			timestamp: new Date(),
			caller: "testCaller",
			userId: "user-123",
		},
	});

	test("should call serverLogger.warn for system.warning", async () => {
		const event = createEvent("system.warning", {
			message: "Cache miss rate high",
			status: 200,
			shouldNotify: false,
		});

		await handler.handle(event);

		expect(serverLogger.warn).toHaveBeenCalledWith(
			"Cache miss rate high",
			{ caller: "testCaller", status: 200, userId: "user-123" },
			undefined,
		);
	});

	test("should call serverLogger.error for system.error", async () => {
		const event = createEvent("system.error", {
			message: "Database connection failed",
			status: 500,
			shouldNotify: false,
			extraData: { host: "localhost" },
		});

		await handler.handle(event);

		expect(serverLogger.error).toHaveBeenCalledWith(
			"Database connection failed",
			{ caller: "testCaller", status: 500, userId: "user-123" },
			{ host: "localhost" },
			undefined,
		);
	});

	test("should pass notify option when shouldNotify is true for warning", async () => {
		const event = createEvent("system.warning", {
			message: "Warning with notify",
			status: 200,
			shouldNotify: true,
		});

		await handler.handle(event);

		expect(serverLogger.warn).toHaveBeenCalledWith(
			"Warning with notify",
			{ caller: "testCaller", status: 200, userId: "user-123" },
			{ notify: true },
		);
	});

	test("should pass notify option when shouldNotify is true for error", async () => {
		const event = createEvent("system.error", {
			message: "Error with notify",
			status: 500,
			shouldNotify: true,
			extraData: undefined,
		});

		await handler.handle(event);

		expect(serverLogger.error).toHaveBeenCalledWith(
			"Error with notify",
			{ caller: "testCaller", status: 500, userId: "user-123" },
			undefined,
			{ notify: true },
		);
	});

	test("should do nothing for unknown event type", async () => {
		const event = createEvent("unknown.event", {
			message: "Unknown",
			status: 200,
		});

		await handler.handle(event);

		expect(serverLogger.warn).not.toHaveBeenCalled();
		expect(serverLogger.error).not.toHaveBeenCalled();
	});
});

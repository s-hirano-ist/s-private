import type { Logger } from "@s-hirano-ist/s-application/observability/logger.interface";
import type { DomainEvent } from "@s-hirano-ist/s-core/shared-kernel/events/domain-event.interface";
import { SystemEventHandler } from "@s-hirano-ist/s-infrastructure/events/system-event-handler";
import { describe, expect, test, vi } from "vite-plus/test";

const serverLogger: Logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

describe("SystemEventHandler", () => {
	const handler = new SystemEventHandler(serverLogger);

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
		});

		await handler.handle(event);

		expect(serverLogger.warn).toHaveBeenCalledWith("Cache miss rate high", {
			caller: "testCaller",
			status: 200,
			userId: "user-123",
		});
	});

	test("should call serverLogger.error for system.error", async () => {
		const event = createEvent("system.error", {
			message: "Database connection failed",
			status: 500,
			severity: "normal",
			extraData: { host: "localhost" },
		});

		await handler.handle(event);

		expect(serverLogger.error).toHaveBeenCalledWith(
			"Database connection failed",
			{ caller: "testCaller", status: 500, userId: "user-123" },
			{ host: "localhost" },
			{ severity: "normal" },
		);
	});

	test("should include warning extra data in log context", async () => {
		const event = createEvent("system.warning", {
			message: "Upload file rejected",
			status: 500,
			extraData: { reason: "metadata-read-failed" },
		});

		await handler.handle(event);

		expect(serverLogger.warn).toHaveBeenCalledWith("Upload file rejected", {
			caller: "testCaller",
			status: 500,
			userId: "user-123",
			additionalContext: {
				extraData: { reason: "metadata-read-failed" },
			},
		});
	});

	test("should pass critical severity for error", async () => {
		const event = createEvent("system.error", {
			message: "Error with notify",
			status: 500,
			severity: "critical",
			extraData: undefined,
		});

		await handler.handle(event);

		expect(serverLogger.error).toHaveBeenCalledWith(
			"Error with notify",
			{ caller: "testCaller", status: 500, userId: "user-123" },
			undefined,
			{ severity: "critical" },
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

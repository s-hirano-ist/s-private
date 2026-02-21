import { describe, expect, test } from "vitest";
import { SystemErrorEvent } from "./system-error-event";
import { SystemWarningEvent } from "./system-warning-event";

describe("SystemErrorEvent", () => {
	test("should have eventType 'system.error'", () => {
		const event = new SystemErrorEvent({
			message: "Database connection failed",
			status: 500,
			caller: "connectDatabase",
		});
		expect(event.eventType).toBe("system.error");
	});

	test("should set payload correctly", () => {
		const event = new SystemErrorEvent({
			message: "Database connection failed",
			status: 500,
			caller: "connectDatabase",
			extraData: { host: "localhost" },
		});
		expect(event.payload).toEqual({
			message: "Database connection failed",
			status: 500,
			extraData: { host: "localhost" },
			shouldNotify: false,
		});
	});

	test("should default shouldNotify to false", () => {
		const event = new SystemErrorEvent({
			message: "Error",
			status: 500,
			caller: "test",
		});
		expect(event.payload.shouldNotify).toBe(false);
	});

	test("should accept shouldNotify true", () => {
		const event = new SystemErrorEvent({
			message: "Critical Error",
			status: 500,
			caller: "test",
			shouldNotify: true,
		});
		expect(event.payload.shouldNotify).toBe(true);
	});

	test("should default userId to 'system' when not provided", () => {
		const event = new SystemErrorEvent({
			message: "Error",
			status: 500,
			caller: "test",
		});
		expect(event.metadata.userId).toBe("system");
	});

	test("should accept custom userId", () => {
		const event = new SystemErrorEvent({
			message: "Error",
			status: 500,
			caller: "test",
			userId: "user-123",
		});
		expect(event.metadata.userId).toBe("user-123");
	});

	test("should set metadata correctly", () => {
		const event = new SystemErrorEvent({
			message: "Error",
			status: 500,
			caller: "testCaller",
			userId: "user-456",
		});
		expect(event.metadata.caller).toBe("testCaller");
		expect(event.metadata.userId).toBe("user-456");
		expect(event.metadata.timestamp).toBeInstanceOf(Date);
	});

	test("should handle undefined extraData", () => {
		const event = new SystemErrorEvent({
			message: "Error",
			status: 500,
			caller: "test",
		});
		expect(event.payload.extraData).toBeUndefined();
	});
});

describe("SystemWarningEvent", () => {
	test("should have eventType 'system.warning'", () => {
		const event = new SystemWarningEvent({
			message: "Cache miss rate high",
			status: 200,
			caller: "cacheService",
		});
		expect(event.eventType).toBe("system.warning");
	});

	test("should set payload correctly", () => {
		const event = new SystemWarningEvent({
			message: "Cache miss rate high",
			status: 200,
			caller: "cacheService",
			extraData: { missRate: 0.75 },
		});
		expect(event.payload).toEqual({
			message: "Cache miss rate high",
			status: 200,
			extraData: { missRate: 0.75 },
			shouldNotify: false,
		});
	});

	test("should default shouldNotify to false", () => {
		const event = new SystemWarningEvent({
			message: "Warning",
			status: 200,
			caller: "test",
		});
		expect(event.payload.shouldNotify).toBe(false);
	});

	test("should accept shouldNotify true", () => {
		const event = new SystemWarningEvent({
			message: "Warning",
			status: 200,
			caller: "test",
			shouldNotify: true,
		});
		expect(event.payload.shouldNotify).toBe(true);
	});

	test("should default userId to 'system' when not provided", () => {
		const event = new SystemWarningEvent({
			message: "Warning",
			status: 200,
			caller: "test",
		});
		expect(event.metadata.userId).toBe("system");
	});

	test("should accept custom userId", () => {
		const event = new SystemWarningEvent({
			message: "Warning",
			status: 200,
			caller: "test",
			userId: "user-789",
		});
		expect(event.metadata.userId).toBe("user-789");
	});

	test("should set metadata correctly", () => {
		const event = new SystemWarningEvent({
			message: "Warning",
			status: 200,
			caller: "testCaller",
		});
		expect(event.metadata.caller).toBe("testCaller");
		expect(event.metadata.userId).toBe("system");
		expect(event.metadata.timestamp).toBeInstanceOf(Date);
	});
});

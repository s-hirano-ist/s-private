import { describe, expect, test } from "vitest";
import { BaseDomainEvent } from "./base-domain-event.ts";

type TestPayload = { message: string };

class TestEvent extends BaseDomainEvent<TestPayload> {
	constructor(data: {
		message: string;
		caller: string;
		userId: string;
	}) {
		super(
			"test.event",
			{ message: data.message },
			{ caller: data.caller, userId: data.userId },
		);
	}
}

describe("BaseDomainEvent", () => {
	test("should set eventType correctly", () => {
		const event = new TestEvent({
			message: "test",
			caller: "testCaller",
			userId: "user-123",
		});
		expect(event.eventType).toBe("test.event");
	});

	test("should set payload correctly", () => {
		const event = new TestEvent({
			message: "hello world",
			caller: "testCaller",
			userId: "user-123",
		});
		expect(event.payload).toEqual({ message: "hello world" });
	});

	test("should set metadata.caller correctly", () => {
		const event = new TestEvent({
			message: "test",
			caller: "myCaller",
			userId: "user-123",
		});
		expect(event.metadata.caller).toBe("myCaller");
	});

	test("should set metadata.userId correctly", () => {
		const event = new TestEvent({
			message: "test",
			caller: "testCaller",
			userId: "user-456",
		});
		expect(event.metadata.userId).toBe("user-456");
	});

	test("should auto-generate metadata.timestamp as Date instance", () => {
		const before = new Date();
		const event = new TestEvent({
			message: "test",
			caller: "testCaller",
			userId: "user-123",
		});
		const after = new Date();

		expect(event.metadata.timestamp).toBeInstanceOf(Date);
		expect(event.metadata.timestamp.getTime()).toBeGreaterThanOrEqual(
			before.getTime(),
		);
		expect(event.metadata.timestamp.getTime()).toBeLessThanOrEqual(
			after.getTime(),
		);
	});
});

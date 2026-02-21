import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("./event-dispatcher", () => ({
	eventDispatcher: {
		register: vi.fn(),
	},
}));

vi.mock("./handlers/logging-event-handler", () => ({
	LoggingEventHandler: vi.fn(),
}));

vi.mock("./handlers/system-event-handler", () => ({
	SystemEventHandler: vi.fn(),
}));

describe("event-setup", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	test("should register 10 event handlers on first call", async () => {
		const { eventDispatcher } = await import("./event-dispatcher");
		const { initializeEventHandlers } = await import("./event-setup");

		initializeEventHandlers();

		expect(eventDispatcher.register).toHaveBeenCalledTimes(10);

		// 8 domain events
		expect(eventDispatcher.register).toHaveBeenCalledWith(
			"article.created",
			expect.any(Object),
		);
		expect(eventDispatcher.register).toHaveBeenCalledWith(
			"article.deleted",
			expect.any(Object),
		);
		expect(eventDispatcher.register).toHaveBeenCalledWith(
			"note.created",
			expect.any(Object),
		);
		expect(eventDispatcher.register).toHaveBeenCalledWith(
			"note.deleted",
			expect.any(Object),
		);
		expect(eventDispatcher.register).toHaveBeenCalledWith(
			"image.created",
			expect.any(Object),
		);
		expect(eventDispatcher.register).toHaveBeenCalledWith(
			"image.deleted",
			expect.any(Object),
		);
		expect(eventDispatcher.register).toHaveBeenCalledWith(
			"book.created",
			expect.any(Object),
		);
		expect(eventDispatcher.register).toHaveBeenCalledWith(
			"book.deleted",
			expect.any(Object),
		);

		// 2 system events
		expect(eventDispatcher.register).toHaveBeenCalledWith(
			"system.warning",
			expect.any(Object),
		);
		expect(eventDispatcher.register).toHaveBeenCalledWith(
			"system.error",
			expect.any(Object),
		);
	});

	test("should not register handlers on second call (isInitialized guard)", async () => {
		const { eventDispatcher } = await import("./event-dispatcher");
		const { initializeEventHandlers } = await import("./event-setup");

		initializeEventHandlers();

		expect(eventDispatcher.register).toHaveBeenCalledTimes(10);

		vi.mocked(eventDispatcher.register).mockClear();

		initializeEventHandlers();

		expect(eventDispatcher.register).not.toHaveBeenCalled();
	});
});

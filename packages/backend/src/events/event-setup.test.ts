import { createEventInitializer } from "@s-hirano-ist/s-backend/events/event-setup";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
let eventDispatcher: { register: ReturnType<typeof vi.fn> };
let initializeEventHandlers: () => void;

describe("event-setup", () => {
	beforeEach(() => {
		eventDispatcher = { register: vi.fn() };
		initializeEventHandlers = createEventInitializer(eventDispatcher, {
			logging: { handle: vi.fn() },
			system: { handle: vi.fn() },
		});
		vi.clearAllMocks();
	});

	test("should register 10 event handlers on first call", async () => {
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
		initializeEventHandlers();

		expect(eventDispatcher.register).toHaveBeenCalledTimes(10);

		vi.mocked(eventDispatcher.register).mockClear();

		initializeEventHandlers();

		expect(eventDispatcher.register).not.toHaveBeenCalled();
	});
});

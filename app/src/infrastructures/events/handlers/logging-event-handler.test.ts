import type { DomainEvent } from "@s-hirano-ist/s-core/shared-kernel/events/domain-event.interface";
import { describe, expect, test, vi } from "vitest";
import { serverLogger } from "@/infrastructures/observability/server";
import { LoggingEventHandler } from "./logging-event-handler";

describe("LoggingEventHandler", () => {
	const handler = new LoggingEventHandler();

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

	test("should log article.created with status 201", async () => {
		const event = createEvent("article.created", {
			title: "Test Article",
			url: "https://example.com",
			quote: "A quote",
			categoryName: "Tech",
		});

		await handler.handle(event);

		expect(serverLogger.info).toHaveBeenCalledWith(
			expect.stringContaining("【ARTICLE】"),
			{ caller: "testCaller", status: 201, userId: "user-123" },
			{ notify: true },
		);
		expect(serverLogger.info).toHaveBeenCalledWith(
			expect.stringContaining("title: Test Article"),
			expect.any(Object),
			expect.any(Object),
		);
	});

	test("should log article.deleted with status 200", async () => {
		const event = createEvent("article.deleted", { title: "Deleted Article" });

		await handler.handle(event);

		expect(serverLogger.info).toHaveBeenCalledWith(
			expect.stringContaining("削除"),
			{ caller: "testCaller", status: 200, userId: "user-123" },
			{ notify: true },
		);
	});

	test("should log note.created with status 201", async () => {
		const event = createEvent("note.created", {
			title: "Test Note",
			markdown: "# Content",
		});

		await handler.handle(event);

		expect(serverLogger.info).toHaveBeenCalledWith(
			expect.stringContaining("【NOTES】"),
			{ caller: "testCaller", status: 201, userId: "user-123" },
			{ notify: true },
		);
	});

	test("should log note.deleted with status 200", async () => {
		const event = createEvent("note.deleted", { title: "Deleted Note" });

		await handler.handle(event);

		expect(serverLogger.info).toHaveBeenCalledWith(
			expect.stringContaining("削除"),
			{ caller: "testCaller", status: 200, userId: "user-123" },
			{ notify: true },
		);
	});

	test("should log image.created with status 201", async () => {
		const event = createEvent("image.created", {
			id: "img-123",
			path: "image.jpg",
		});

		await handler.handle(event);

		expect(serverLogger.info).toHaveBeenCalledWith(
			expect.stringContaining("【IMAGE】"),
			{ caller: "testCaller", status: 201, userId: "user-123" },
			{ notify: true },
		);
	});

	test("should log image.deleted with status 200", async () => {
		const event = createEvent("image.deleted", { path: "image.jpg" });

		await handler.handle(event);

		expect(serverLogger.info).toHaveBeenCalledWith(
			expect.stringContaining("削除"),
			{ caller: "testCaller", status: 200, userId: "user-123" },
			{ notify: true },
		);
	});

	test("should log book.created with status 201", async () => {
		const event = createEvent("book.created", {
			isbn: "978-4-06-521234-5",
			title: "Test Book",
		});

		await handler.handle(event);

		expect(serverLogger.info).toHaveBeenCalledWith(
			expect.stringContaining("【BOOKS】"),
			{ caller: "testCaller", status: 201, userId: "user-123" },
			{ notify: true },
		);
	});

	test("should log book.deleted with status 200", async () => {
		const event = createEvent("book.deleted", { title: "Deleted Book" });

		await handler.handle(event);

		expect(serverLogger.info).toHaveBeenCalledWith(
			expect.stringContaining("削除"),
			{ caller: "testCaller", status: 200, userId: "user-123" },
			{ notify: true },
		);
	});

	test("should log 'Unknown event' for unrecognized event type with status 200", async () => {
		const event = createEvent("unknown.event", {});

		await handler.handle(event);

		expect(serverLogger.info).toHaveBeenCalledWith(
			"Unknown event: unknown.event",
			{ caller: "testCaller", status: 200, userId: "user-123" },
			{ notify: true },
		);
	});
});

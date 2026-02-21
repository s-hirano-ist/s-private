import { describe, expect, test } from "vitest";
import { BookCreatedEvent } from "./book-created-event";
import { BookDeletedEvent } from "./book-deleted-event";

describe("BookCreatedEvent", () => {
	test("should have eventType 'book.created'", () => {
		const event = new BookCreatedEvent({
			isbn: "978-4-06-521234-5",
			title: "The Pragmatic Programmer",
			userId: "user-123",
			caller: "addBook",
		});
		expect(event.eventType).toBe("book.created");
	});

	test("should set payload correctly", () => {
		const event = new BookCreatedEvent({
			isbn: "978-4-06-521234-5",
			title: "The Pragmatic Programmer",
			userId: "user-123",
			caller: "addBook",
		});
		expect(event.payload).toEqual({
			isbn: "978-4-06-521234-5",
			title: "The Pragmatic Programmer",
		});
	});

	test("should set metadata correctly", () => {
		const event = new BookCreatedEvent({
			isbn: "978-4-06-521234-5",
			title: "The Pragmatic Programmer",
			userId: "user-123",
			caller: "addBook",
		});
		expect(event.metadata.caller).toBe("addBook");
		expect(event.metadata.userId).toBe("user-123");
		expect(event.metadata.timestamp).toBeInstanceOf(Date);
	});
});

describe("BookDeletedEvent", () => {
	test("should have eventType 'book.deleted'", () => {
		const event = new BookDeletedEvent({
			title: "Deleted Book",
			userId: "user-123",
			caller: "deleteBook",
		});
		expect(event.eventType).toBe("book.deleted");
	});

	test("should set payload correctly", () => {
		const event = new BookDeletedEvent({
			title: "Deleted Book",
			userId: "user-123",
			caller: "deleteBook",
		});
		expect(event.payload).toEqual({ title: "Deleted Book" });
	});

	test("should set metadata correctly", () => {
		const event = new BookDeletedEvent({
			title: "Deleted Book",
			userId: "user-123",
			caller: "deleteBook",
		});
		expect(event.metadata.caller).toBe("deleteBook");
		expect(event.metadata.userId).toBe("user-123");
		expect(event.metadata.timestamp).toBeInstanceOf(Date);
	});
});

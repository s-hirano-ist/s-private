import { describe, expect, test } from "vitest";
import { NoteCreatedEvent } from "./note-created-event";
import { NoteDeletedEvent } from "./note-deleted-event";

describe("NoteCreatedEvent", () => {
	test("should have eventType 'note.created'", () => {
		const event = new NoteCreatedEvent({
			title: "Meeting Notes",
			markdown: "# Meeting Notes\n\n- Item 1",
			userId: "user-123",
			caller: "addNote",
		});
		expect(event.eventType).toBe("note.created");
	});

	test("should set payload correctly", () => {
		const event = new NoteCreatedEvent({
			title: "Meeting Notes",
			markdown: "# Meeting Notes\n\n- Item 1",
			userId: "user-123",
			caller: "addNote",
		});
		expect(event.payload).toEqual({
			title: "Meeting Notes",
			markdown: "# Meeting Notes\n\n- Item 1",
		});
	});

	test("should set metadata correctly", () => {
		const event = new NoteCreatedEvent({
			title: "Meeting Notes",
			markdown: "# Meeting Notes",
			userId: "user-123",
			caller: "addNote",
		});
		expect(event.metadata.caller).toBe("addNote");
		expect(event.metadata.userId).toBe("user-123");
		expect(event.metadata.timestamp).toBeInstanceOf(Date);
	});
});

describe("NoteDeletedEvent", () => {
	test("should have eventType 'note.deleted'", () => {
		const event = new NoteDeletedEvent({
			title: "Deleted Note",
			userId: "user-123",
			caller: "deleteNote",
		});
		expect(event.eventType).toBe("note.deleted");
	});

	test("should set payload correctly", () => {
		const event = new NoteDeletedEvent({
			title: "Deleted Note",
			userId: "user-123",
			caller: "deleteNote",
		});
		expect(event.payload).toEqual({ title: "Deleted Note" });
	});

	test("should set metadata correctly", () => {
		const event = new NoteDeletedEvent({
			title: "Deleted Note",
			userId: "user-123",
			caller: "deleteNote",
		});
		expect(event.metadata.caller).toBe("deleteNote");
		expect(event.metadata.userId).toBe("user-123");
		expect(event.metadata.timestamp).toBeInstanceOf(Date);
	});
});

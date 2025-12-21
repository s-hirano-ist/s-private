import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { makeUserId } from "../../common/entities/common-entity";
import {
	makeMarkdown,
	makeNoteTitle,
	noteEntity,
} from "../entities/note-entity";

describe("noteEntity", () => {
	describe("makeNoteTitle", () => {
		test("should create valid note title", () => {
			const title = makeNoteTitle("My Article");
			expect(title).toBe("My Article");
		});

		test("should throw error for empty string", () => {
			expect(() => makeNoteTitle("")).toThrow(ZodError);
		});

		test("should throw error for too long title", () => {
			expect(() => makeNoteTitle("a".repeat(65))).toThrow(ZodError);
		});
	});

	describe("makeMarkdown", () => {
		test("should create valid markdown", () => {
			const markdown = makeMarkdown("# Hello World");
			expect(markdown).toBe("# Hello World");
		});

		test("should throw error for empty string", () => {
			expect(() => makeMarkdown("")).toThrow(ZodError);
		});
	});

	describe("noteEntity.create", () => {
		test("should create note with valid arguments", () => {
			const note = noteEntity.create({
				userId: makeUserId("test-user-id"),
				title: makeNoteTitle("My Article"),
				markdown: makeMarkdown("# Hello World\n\nThis is my article."),
			});

			expect(note.userId).toBe("test-user-id");
			expect(note.title).toBe("My Article");
			expect(note.markdown).toBe("# Hello World\n\nThis is my article.");
			expect(note.status).toBe("UNEXPORTED");
			expect(note.id).toBeDefined();
		});

		test("should create note with UNEXPORTED status by default", () => {
			const note = noteEntity.create({
				userId: makeUserId("test-user-id"),
				title: makeNoteTitle("Test Article"),
				markdown: makeMarkdown("Note here"),
			});

			expect(note.status).toBe("UNEXPORTED");
		});

		test("should be frozen object", () => {
			const note = noteEntity.create({
				userId: makeUserId("test-user-id"),
				title: makeNoteTitle("Test Article"),
				markdown: makeMarkdown("Note here"),
			});

			expect(Object.isFrozen(note)).toBe(true);
		});
	});

	describe("noteEntity.markAsLastUpdated", () => {
		test("should transition note from UNEXPORTED to LAST_UPDATED", () => {
			const note = noteEntity.create({
				userId: makeUserId("test-user-id"),
				title: makeNoteTitle("Test Note"),
				markdown: makeMarkdown("Content here"),
			});

			const lastUpdatedNote = noteEntity.markAsLastUpdated(note);

			expect(lastUpdatedNote.status).toBe("LAST_UPDATED");
			expect(lastUpdatedNote.id).toBe(note.id);
			expect(lastUpdatedNote.title).toBe(note.title);
		});

		test("should return frozen object", () => {
			const note = noteEntity.create({
				userId: makeUserId("test-user-id"),
				title: makeNoteTitle("Test Note"),
				markdown: makeMarkdown("Content here"),
			});

			const lastUpdatedNote = noteEntity.markAsLastUpdated(note);

			expect(Object.isFrozen(lastUpdatedNote)).toBe(true);
		});
	});

	describe("noteEntity.revert", () => {
		test("should transition note from LAST_UPDATED back to UNEXPORTED", () => {
			const note = noteEntity.create({
				userId: makeUserId("test-user-id"),
				title: makeNoteTitle("Test Note"),
				markdown: makeMarkdown("Content here"),
			});
			const lastUpdatedNote = noteEntity.markAsLastUpdated(note);

			const revertedNote = noteEntity.revert(lastUpdatedNote);

			expect(revertedNote.status).toBe("UNEXPORTED");
			expect(revertedNote.id).toBe(note.id);
			expect(revertedNote.title).toBe(note.title);
		});

		test("should return frozen object", () => {
			const note = noteEntity.create({
				userId: makeUserId("test-user-id"),
				title: makeNoteTitle("Test Note"),
				markdown: makeMarkdown("Content here"),
			});
			const lastUpdatedNote = noteEntity.markAsLastUpdated(note);

			const revertedNote = noteEntity.revert(lastUpdatedNote);

			expect(Object.isFrozen(revertedNote)).toBe(true);
		});
	});

	describe("noteEntity.finalize", () => {
		test("should transition note from LAST_UPDATED to EXPORTED", () => {
			const note = noteEntity.create({
				userId: makeUserId("test-user-id"),
				title: makeNoteTitle("Test Note"),
				markdown: makeMarkdown("Content here"),
			});
			const lastUpdatedNote = noteEntity.markAsLastUpdated(note);

			const exportedNote = noteEntity.finalize(lastUpdatedNote);

			expect(exportedNote.status).toBe("EXPORTED");
			expect(exportedNote.exportedAt).toBeInstanceOf(Date);
			expect(exportedNote.id).toBe(note.id);
			expect(exportedNote.title).toBe(note.title);
		});

		test("should return frozen object", () => {
			const note = noteEntity.create({
				userId: makeUserId("test-user-id"),
				title: makeNoteTitle("Test Note"),
				markdown: makeMarkdown("Content here"),
			});
			const lastUpdatedNote = noteEntity.markAsLastUpdated(note);

			const exportedNote = noteEntity.finalize(lastUpdatedNote);

			expect(Object.isFrozen(exportedNote)).toBe(true);
		});
	});
});

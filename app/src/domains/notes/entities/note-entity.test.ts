import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import {
	makeMarkdown,
	makeNoteTitle,
	noteEntity,
} from "@/domains/notes/entities/note-entity";
import { makeUserId } from "../../common/entities/common-entity";

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
});

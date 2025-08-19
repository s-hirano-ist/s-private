import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Status } from "@/domains/common/entities/common-entity";
import {
	makeId,
	makeStatus,
	makeUserId,
} from "@/domains/common/entities/common-entity";
import {
	makeMarkdown,
	makeNoteTitle,
} from "@/domains/notes/entities/note-entity";
import prisma from "@/prisma";
import { notesCommandRepository } from "./notes-command-repository";

describe("NotesCommandRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("create", () => {
		test("should create note successfully", async () => {
			const mockNote = {
				id: "0198bfc4-444e-73e8-9ef6-eb9b250ed1ae",
				title: "Test Note",
				markdown: "# Test Note\n\nThis is test markdown note.",
				userId: "user123",
				status: "UNEXPORTED" as Status,
				createdAt: new Date(),
				updatedAt: new Date(),
				exportedAt: null,
			};

			vi.mocked(prisma.note.create).mockResolvedValue(mockNote);

			const result = await notesCommandRepository.create({
				title: makeNoteTitle("Test Note"),
				markdown: makeMarkdown("# Test Note\n\nThis is test markdown note."),
				userId: makeUserId("user123"),
				id: makeId("0198bfc4-444e-73e8-9ef6-eb9b250ed1ae"),
				status: makeStatus("UNEXPORTED"),
			});

			expect(prisma.note.create).toHaveBeenCalledWith({
				data: {
					title: "Test Note",
					markdown: "# Test Note\n\nThis is test markdown note.",
					userId: "user123",
					id: "0198bfc4-444e-73e8-9ef6-eb9b250ed1ae",
					status: "UNEXPORTED",
				},
			});
			expect(result).toBeUndefined();
		});

		test("should handle database errors during create", async () => {
			vi.mocked(prisma.note.create).mockRejectedValue(
				new Error("Database constraint error"),
			);

			await expect(
				notesCommandRepository.create({
					title: makeNoteTitle("Test Note"),
					markdown: makeMarkdown("# Test Note\n\nThis is test markdown note."),
					userId: makeUserId("user123"),
					id: makeId("0198bfc4-444e-73e8-9ef6-eb9b250ed1ae"),
					status: makeStatus("EXPORTED"),
				}),
			).rejects.toThrow("Database constraint error");

			expect(prisma.note.create).toHaveBeenCalledWith({
				data: {
					title: "Test Note",
					markdown: "# Test Note\n\nThis is test markdown note.",
					userId: "user123",
					id: "0198bfc4-444e-73e8-9ef6-eb9b250ed1ae",
					status: "EXPORTED",
				},
			});
		});
	});

	describe("deleteById", () => {
		test("should delete note and log success", async () => {
			const id = makeId("0198bfc4-444e-73e8-9ef6-eb9b250ed1ae");
			const userId = makeUserId("test-user-id");
			const status = makeStatus("UNEXPORTED");

			const mockDeletedNote = {
				title: "Deleted Note",
			} as any;

			vi.mocked(prisma.note.delete).mockResolvedValue(mockDeletedNote);

			await notesCommandRepository.deleteById(id, userId, status);

			expect(prisma.note.delete).toHaveBeenCalledWith({
				where: { id, userId, status },
				select: { title: true },
			});
		});

		test("should delete note with different status", async () => {
			const id = makeId("0198bfc5-555f-74f9-af07-fc9c251fe2bf");
			const userId = makeUserId("test-user-id-2");
			const status = makeStatus("EXPORTED");

			const mockDeletedNote = {
				title: "Another Note",
			} as any;

			vi.mocked(prisma.note.delete).mockResolvedValue(mockDeletedNote);

			await notesCommandRepository.deleteById(id, userId, status);

			expect(prisma.note.delete).toHaveBeenCalledWith({
				where: { id, userId, status },
				select: { title: true },
			});
		});

		test("should handle deletion errors", async () => {
			const id = makeId("0198bfc4-444e-73e8-9ef6-eb9b250ed1ae");
			const userId = makeUserId("test-user-id");
			const status = makeStatus("UNEXPORTED");

			vi.mocked(prisma.note.delete).mockRejectedValue(
				new Error("Note not found"),
			);

			await expect(
				notesCommandRepository.deleteById(id, userId, status),
			).rejects.toThrow("Note not found");

			expect(prisma.note.delete).toHaveBeenCalledWith({
				where: { id, userId, status },
				select: { title: true },
			});
		});
	});
});

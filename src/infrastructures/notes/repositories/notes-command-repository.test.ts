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
});

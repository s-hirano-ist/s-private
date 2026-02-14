import {
	makeMarkdown,
	makeNoteTitle,
} from "@s-hirano-ist/s-core/notes/entities/note-entity";
import {
	makeCreatedAt,
	makeExportedAt,
	makeId,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import prisma from "@/prisma";
import { notesQueryRepository } from "./notes-query-repository";

describe("NotesQueryRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findByTitle", () => {
		test("should find note by title, userId", async () => {
			const mockNote = {
				id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b",
				userId: "user123",
				title: "Test Note",
				markdown: "# Test Note\n\nThis is test markdown note.",
				status: "EXPORTED" as const,
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-01"),
				exportedAt: new Date("2024-01-02"),
			};

			vi.mocked(prisma.note.findUnique).mockResolvedValue(mockNote);

			const result = await notesQueryRepository.findByTitle(
				makeNoteTitle("Test Note"),
				makeUserId("user123"),
			);

			expect(prisma.note.findUnique).toHaveBeenCalledWith({
				where: { title_userId: { title: "Test Note", userId: "user123" } },
				select: {
					id: true,
					userId: true,
					title: true,
					markdown: true,
					status: true,
					createdAt: true,
					exportedAt: true,
				},
			});
			expect(result).toEqual({
				id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b"),
				userId: makeUserId("user123"),
				title: makeNoteTitle("Test Note"),
				markdown: makeMarkdown("# Test Note\n\nThis is test markdown note."),
				status: "EXPORTED",
				createdAt: makeCreatedAt(new Date("2024-01-01")),
				exportedAt: makeExportedAt(new Date("2024-01-02")),
			});
		});

		test("should return null when note not found", async () => {
			vi.mocked(prisma.note.findUnique).mockResolvedValue(null);

			const result = await notesQueryRepository.findByTitle(
				makeNoteTitle("Nonexistent Note"),
				makeUserId("user123"),
			);

			expect(prisma.note.findUnique).toHaveBeenCalledWith({
				where: {
					title_userId: { title: "Nonexistent Note", userId: "user123" },
				},
				select: {
					id: true,
					userId: true,
					title: true,
					markdown: true,
					status: true,
					createdAt: true,
					exportedAt: true,
				},
			});
			expect(result).toBeNull();
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.note.findUnique).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(
				notesQueryRepository.findByTitle(
					makeNoteTitle("Test Note"),
					makeUserId("user123"),
				),
			).rejects.toThrow("Database error");

			expect(prisma.note.findUnique).toHaveBeenCalledWith({
				where: { title_userId: { title: "Test Note", userId: "user123" } },
				select: {
					id: true,
					userId: true,
					title: true,
					markdown: true,
					status: true,
					createdAt: true,
					exportedAt: true,
				},
			});
		});
	});

	describe("findMany", () => {
		test("should find multiple notes successfully", async () => {
			const mockNotes = [
				{ id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b", title: "First Note", markdown: "# First", status: "EXPORTED" as const, userId: "user123", createdAt: new Date("2024-01-01"), updatedAt: new Date("2024-01-01"), exportedAt: null },
				{ id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7c", title: "Second Note", markdown: "# Second", status: "EXPORTED" as const, userId: "user123", createdAt: new Date("2024-01-02"), updatedAt: new Date("2024-01-02"), exportedAt: null },
				{ id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7d", title: "Third Note", markdown: "# Third", status: "EXPORTED" as const, userId: "user123", createdAt: new Date("2024-01-03"), updatedAt: new Date("2024-01-03"), exportedAt: null },
			];

			vi.mocked(prisma.note.findMany).mockResolvedValue(mockNotes);

			const params = {
				orderBy: { createdAt: "desc" as const },
				take: 10,
				skip: 0,
			};

			const result = await notesQueryRepository.findMany(
				makeUserId("user123"),
				"EXPORTED",
				params,
			);

			expect(prisma.note.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { id: true, title: true },
				...params,
			});
			expect(result).toEqual([
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b"),
					title: makeNoteTitle("First Note"),
				},
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7c"),
					title: makeNoteTitle("Second Note"),
				},
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7d"),
					title: makeNoteTitle("Third Note"),
				},
			]);
		});

		test("should handle empty results", async () => {
			vi.mocked(prisma.note.findMany).mockResolvedValue([]);

			const result = await notesQueryRepository.findMany(
				makeUserId("user123"),
				"EXPORTED",
				{},
			);

			expect(prisma.note.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { id: true, title: true },
			});
			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.note.findMany).mockRejectedValue(
				new Error("Database connection error"),
			);

			await expect(
				notesQueryRepository.findMany(makeUserId("user123"), "EXPORTED", {}),
			).rejects.toThrow("Database connection error");

			expect(prisma.note.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { id: true, title: true },
			});
		});
	});

	describe("count", () => {
		test("should return count of notes", async () => {
			vi.mocked(prisma.note.count).mockResolvedValue(15);

			const result = await notesQueryRepository.count(
				makeUserId("user123"),
				"EXPORTED",
			);

			expect(prisma.note.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
			});
			expect(result).toBe(15);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(prisma.note.count).mockResolvedValue(0);

			const result = await notesQueryRepository.count(
				makeUserId("user123"),
				"UNEXPORTED",
			);

			expect(prisma.note.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "UNEXPORTED" },
			});
			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.note.count).mockRejectedValue(
				new Error("Database count error"),
			);

			await expect(
				notesQueryRepository.count(makeUserId("user123"), "EXPORTED"),
			).rejects.toThrow("Database count error");

			expect(prisma.note.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
			});
		});
	});
});

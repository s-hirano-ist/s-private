import { beforeEach, describe, expect, test, vi } from "vitest";

import { makeUserId } from "@/domains/common/entities/common-entity";
import { makeNoteTitle } from "@/domains/notes/entities/note-entity";
import prisma from "@/prisma";
import { notesQueryRepository } from "./notes-query-repository";

describe("NotesQueryRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findByTitle", () => {
		test("should find note by title, userId", async () => {
			const mockNote = {
				id: 1,
				title: "Test Note",
				markdown: "# Test Note\n\nThis is test markdown note.",
				status: "EXPORTED",
			};

			vi.mocked(prisma.note.findUnique).mockResolvedValue(mockNote);

			const result = await notesQueryRepository.findByTitle(
				makeNoteTitle("Test Note"),
				makeUserId("user123"),
			);

			expect(prisma.note.findUnique).toHaveBeenCalledWith({
				where: { title_userId: { title: "Test Note", userId: "user123" } },
				select: { id: true, title: true, markdown: true, status: true },
			});
			expect(result).toEqual(mockNote);
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
				select: { id: true, title: true, markdown: true, status: true },
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
				select: { id: true, title: true, markdown: true, status: true },
			});
		});
	});

	describe("findMany", () => {
		test("should find multiple notes successfully", async () => {
			const mockNotes = [
				{ id: 1, title: "First Note" },
				{ id: 2, title: "Second Note" },
				{ id: 3, title: "Third Note" },
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
			expect(result).toEqual(mockNotes);
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

		test("should work with cache strategy", async () => {
			const mockNotes = [{ id: 1, title: "Cached Note" }];

			vi.mocked(prisma.note.findMany).mockResolvedValue(mockNotes);

			const params = {
				cacheStrategy: { ttl: 300, swr: 30, tags: ["notes"] },
			};

			const result = await notesQueryRepository.findMany(
				makeUserId("user123"),
				"EXPORTED",
				params,
			);

			expect(prisma.note.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { id: true, title: true },
				cacheStrategy: { ttl: 300, swr: 30, tags: ["notes"] },
			});
			expect(result).toEqual(mockNotes);
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

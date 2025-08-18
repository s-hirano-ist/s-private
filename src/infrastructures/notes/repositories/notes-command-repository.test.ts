import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Status } from "@/domains/common/entities/common-entity";
import prisma from "@/prisma";
import { notesCommandRepository } from "./notes-command-repository";

describe("NotesCommandRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("create", () => {
		test("should create note successfully", async () => {
			const mockNote = {
				id: "1",
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
				title: "Test Note",
				markdown: "# Test Note\n\nThis is test markdown note.",
				userId: "user123",
				id: "1",
				status: "UNEXPORTED",
			});

			expect(prisma.note.create).toHaveBeenCalledWith({
				data: {
					title: "Test Note",
					markdown: "# Test Note\n\nThis is test markdown note.",
					userId: "user123",
					id: "1",
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
					title: "Test Note",
					markdown: "# Test Note\n\nThis is test markdown note.",
					userId: "user123",
					id: "1",
					status: "EXPORTED",
				}),
			).rejects.toThrow("Database constraint error");

			expect(prisma.note.create).toHaveBeenCalledWith({
				data: {
					title: "Test Note",
					markdown: "# Test Note\n\nThis is test markdown note.",
					userId: "user123",
					id: "1",
					status: "EXPORTED",
				},
			});
		});
	});
});

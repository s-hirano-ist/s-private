import type { INotesQueryRepository } from "@s-hirano-ist/s-core/notes/repositories/notes-query-repository.interface";
import { makeNoteTitle } from "@s-hirano-ist/s-core/notes/entities/note-entity";
import { NotesDomainService } from "@s-hirano-ist/s-core/notes/services/notes-domain-service";
import { makeUserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { DuplicateError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { beforeEach, describe, expect, test, vi } from "vitest";

describe("NotesDomainService", () => {
	let notesQueryRepository: INotesQueryRepository;
	let notesDomainService: NotesDomainService;

	beforeEach(() => {
		notesQueryRepository = {
			findByTitle: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
			search: vi.fn(),
		} as INotesQueryRepository;

		notesDomainService = new NotesDomainService(notesQueryRepository);
	});

	describe("ensureNoDuplicate", () => {
		test("should not throw error when no duplicate exists", async () => {
			const title = makeNoteTitle("My Unique Note");
			const userId = makeUserId("test-user-id");

			vi.mocked(notesQueryRepository.findByTitle).mockResolvedValue(null);

			await expect(
				notesDomainService.ensureNoDuplicate(title, userId),
			).resolves.not.toThrow();

			expect(notesQueryRepository.findByTitle).toHaveBeenCalledWith(
				title,
				userId,
			);
		});

		test("should throw DuplicateError when duplicate exists", async () => {
			const title = makeNoteTitle("Existing Note");
			const userId = makeUserId("test-user-id");

			const mockNote = {
				id: "existing-note-id",
				title,
				userId,
				markdown: "# Existing Note",
				status: "UNEXPORTED" as const,
			};

			vi.mocked(notesQueryRepository.findByTitle).mockResolvedValue(mockNote);

			await expect(
				notesDomainService.ensureNoDuplicate(title, userId),
			).rejects.toThrow(DuplicateError);

			expect(notesQueryRepository.findByTitle).toHaveBeenCalledWith(
				title,
				userId,
			);
		});
	});
});

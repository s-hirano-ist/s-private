import { makeNoteTitle } from "@s-hirano-ist/s-core/notes/entities/note-entity";
import { NotesDomainService } from "@s-hirano-ist/s-core/notes/services/notes-domain-service";
import { makeUserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { DuplicateError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { expect, test, vi } from "vitest";
test("duplication is scoped by owner and independent of the stored lifecycle state", async () => {
	const existsByTitle = vi.fn().mockResolvedValue(false);
	const service = new NotesDomainService({ existsByTitle });
	const key = makeNoteTitle("Title");
	const owner = makeUserId("owner");
	await expect(service.ensureNoDuplicate(key, owner)).resolves.toBeUndefined();
	expect(existsByTitle).toHaveBeenCalledWith(key, owner);
	existsByTitle.mockResolvedValue(true);
	await expect(service.ensureNoDuplicate(key, owner)).rejects.toBeInstanceOf(
		DuplicateError,
	);
});

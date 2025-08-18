import "server-only";
import { DuplicateError } from "@/common/error/error-classes";
import type { UserId } from "@/domains/common/entities/common-entity";
import type { NoteTitle } from "@/domains/notes/entities/note-entity";
import type { INotesQueryRepository } from "@/domains/notes/repositories/notes-query-repository.interface";

export class NotesDomainService {
	constructor(private readonly notesQueryRepository: INotesQueryRepository) {}

	public async ensureNoDuplicate(
		title: NoteTitle,
		userId: UserId,
	): Promise<void> {
		const exists = await this.notesQueryRepository.findByTitle(title, userId);
		if (exists) {
			throw new DuplicateError();
		}
	}
}

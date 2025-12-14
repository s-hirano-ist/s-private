import type { UserId } from "../../common/entities/common-entity";
import { DuplicateError } from "../../errors/error-classes";
import type { NoteTitle } from "../entities/note-entity";
import type { INotesQueryRepository } from "../repositories/notes-query-repository.interface";

async function ensureNoDuplicateNote(
	notesQueryRepository: INotesQueryRepository,
	title: NoteTitle,
	userId: UserId,
): Promise<void> {
	const exists = await notesQueryRepository.findByTitle(title, userId);
	if (exists) {
		throw new DuplicateError();
	}
}

export class NotesDomainService {
	constructor(private readonly notesQueryRepository: INotesQueryRepository) {}

	public async ensureNoDuplicate(title: NoteTitle, userId: UserId) {
		return ensureNoDuplicateNote(this.notesQueryRepository, title, userId);
	}
}

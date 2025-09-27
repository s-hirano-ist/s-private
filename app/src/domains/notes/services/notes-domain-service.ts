import { DuplicateError, UnexpectedError } from "@/common/error/error-classes";
import {
	type Markdown,
	type NoteTitle,
	noteEntity,
	UnexportedNote,
} from "@/domains/notes/entities/note-entity";
import type { INotesQueryRepository } from "@/domains/notes/repositories/notes-query-repository.interface";
import type { UserId } from "../../common/entities/common-entity";

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

type NoteStatus = "NEED_CREATE" | "NEED_UPDATE" | "NO_UPDATE";

async function updateNote(
	notesQueryRepository: INotesQueryRepository,
	title: NoteTitle,
	userId: UserId,
	markdown: Markdown,
): Promise<{ status: NoteStatus; data?: UnexportedNote }> {
	const data = await notesQueryRepository.findByTitle(title, userId);

	if (data?.status !== "UNEXPORTED") return { status: "NO_UPDATE" };

	if (!data) {
		return {
			status: "NEED_CREATE",
			data: noteEntity.create({ userId, title, markdown }),
		};
	}
	const newData = UnexportedNote.safeParse(data);
	if (!newData.success) throw new UnexpectedError();

	if (data.markdown !== markdown) {
		return {
			status: "NEED_UPDATE",
			data: noteEntity.update(newData.data, { title, markdown }),
		};
	}
	return { status: "NO_UPDATE", data: newData.data };
}

export class NotesDomainService {
	constructor(private readonly notesQueryRepository: INotesQueryRepository) {}

	public async ensureNoDuplicate(title: NoteTitle, userId: UserId) {
		return ensureNoDuplicateNote(this.notesQueryRepository, title, userId);
	}

	public async updateNote(
		title: NoteTitle,
		userId: UserId,
		markdown: Markdown,
	) {
		return updateNote(this.notesQueryRepository, title, userId, markdown);
	}
}

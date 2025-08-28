import type { UserId } from "@/domains/common/entities/common-entity";
import {
	makeNoteTitle,
	noteEntity,
	type UnexportedNote,
} from "@/domains/notes/entities/note-entity";

type NotesExportRepository = {
	findUnexported(userId: UserId): Promise<
		Array<{ title: string; userId: string }>
	>;
	markAsExported(title: string, userId: UserId): Promise<void>;
};

export class NotesExportService {
	constructor(
		private readonly notesExportRepository: NotesExportRepository,
	) {}

	public async exportUnexportedNotes(userId: UserId) {
		const unexportedNotes = await this.notesExportRepository.findUnexported(
			userId,
		);

		const exportResults = await Promise.all(
			unexportedNotes.map(async (note) => {
				const noteTitle = makeNoteTitle(note.title);

				const unexportedNote: UnexportedNote = {
					id: "",
					userId,
					title: noteTitle,
					markdown: "",
					status: "UNEXPORTED",
					createdAt: "",
				};

				const exportedNote = noteEntity.export(unexportedNote);

				await this.notesExportRepository.markAsExported(noteTitle, userId);

				return exportedNote;
			}),
		);

		return exportResults;
	}
}
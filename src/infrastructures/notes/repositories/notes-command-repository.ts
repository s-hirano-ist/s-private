import type {
	Id,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import type { Note } from "@/domains/notes/entities/note-entity";
import { NoteCreatedEvent } from "@/domains/notes/events/note-created-event";
import { NoteDeletedEvent } from "@/domains/notes/events/note-deleted-event";
import type { INotesCommandRepository } from "@/domains/notes/repositories/notes-command-repository.interface";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";
import prisma from "@/prisma";

class NotesCommandRepository implements INotesCommandRepository {
	constructor() {
		initializeEventHandlers();
	}
	async create(data: Note) {
		const response = await prisma.note.create({
			data,
			select: {
				title: true,
				markdown: true,
			},
		});
		await eventDispatcher.dispatch(
			new NoteCreatedEvent({
				title: response.title,
				markdown: response.markdown,
				userId: data.userId,
				caller: "addNote",
			}),
		);
	}

	async deleteById(id: Id, userId: UserId, status: Status) {
		const data = await prisma.note.delete({
			where: { id, userId, status },
			select: { title: true },
		});
		await eventDispatcher.dispatch(
			new NoteDeletedEvent({
				title: data.title,
				userId,
				caller: "deleteNote",
			}),
		);
	}
}

export const notesCommandRepository = new NotesCommandRepository();

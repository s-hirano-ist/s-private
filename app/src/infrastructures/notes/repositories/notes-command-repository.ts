import type { Id, Status, UserId } from "s-core/common/entities/common-entity";
import type {
	NoteTitle,
	UnexportedNote,
} from "s-core/notes/entities/note-entity";
import { NoteCreatedEvent } from "s-core/notes/events/note-created-event";
import { NoteDeletedEvent } from "s-core/notes/events/note-deleted-event";
import { NoteUpdatedEvent } from "s-core/notes/events/note-updated-event";
import type { INotesCommandRepository } from "s-core/notes/repositories/notes-command-repository.interface";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";
import prisma from "@/prisma";

initializeEventHandlers();

async function create(data: UnexportedNote) {
	const response = await prisma.note.create({
		data,
		select: { title: true, markdown: true },
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

async function update(title: NoteTitle, userId: UserId, data: UnexportedNote) {
	const response = await prisma.note.update({
		where: { title_userId: { title, userId } },
		data,
		select: { title: true, markdown: true, userId: true },
	});
	await eventDispatcher.dispatch(
		new NoteUpdatedEvent({
			title: response.title,
			markdown: response.markdown,
			userId: response.userId,
			caller: "updateNote",
		}),
	);
}

async function deleteById(id: Id, userId: UserId, status: Status) {
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

export const notesCommandRepository: INotesCommandRepository = {
	create,
	update,
	deleteById,
};

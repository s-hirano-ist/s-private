import type { INotesCommandRepository } from "@s-hirano-ist/s-core/notes/repositories/notes-command-repository.interface";
import type { NotesDomainService } from "@s-hirano-ist/s-core/notes/services/notes-domain-service";
import type { EventDispatcher } from "s-private-backend/shared/ports";
import {
	noteEntity,
	makeNoteTitle,
	makeMarkdown,
} from "@s-hirano-ist/s-core/notes/entities/note-entity";
import { NoteDeletedEvent } from "@s-hirano-ist/s-core/notes/events/note-deleted-event";
import {
	makeUnexportedStatus,
	type Id,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";

export type NoteInput = { markdown: string; title: string };
export function parseNoteInput(input: NoteInput, userId: UserId) {
	return {
		title: makeNoteTitle(input.title),
		markdown: makeMarkdown(input.markdown),
		userId,
	};
}
export type DeleteNoteDeps = {
	commandRepository: INotesCommandRepository;
	eventDispatcher: EventDispatcher;
};
export type CreateNoteDeps = DeleteNoteDeps & {
	domainServiceFactory: {
		createNotesDomainService(): Pick<NotesDomainService, "ensureNoDuplicate">;
	};
};
export async function createNote(
	data: ReturnType<typeof parseNoteInput>,
	deps: CreateNoteDeps,
) {
	const service = deps.domainServiceFactory.createNotesDomainService();
	await service.ensureNoDuplicate(data.title, data.userId);
	const [note, event] = noteEntity.create({ ...data, caller: "addNote" });
	await deps.commandRepository.create(note);
	await deps.eventDispatcher.dispatch(event);
	return { id: note.id };
}
export async function deleteNote(
	id: Id,
	userId: UserId,
	deps: DeleteNoteDeps,
): Promise<void> {
	const { title } = await deps.commandRepository.deleteById(
		id,
		userId,
		makeUnexportedStatus(),
	);
	await deps.eventDispatcher.dispatch(
		new NoteDeletedEvent({ title, userId, caller: "deleteNote" }),
	);
}

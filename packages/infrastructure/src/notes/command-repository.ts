import type {
	DeleteNoteResult,
	INotesCommandRepository,
} from "@s-hirano-ist/s-core/notes/repositories/notes-command-repository.interface";
import type {
	Id,
	Status,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import {
	makeNoteTitle,
	type UnexportedNote,
} from "@s-hirano-ist/s-core/notes/entities/note-entity";
import { withPersistenceErrors } from "@s-hirano-ist/s-infrastructure/persistence-errors";

export function createNotesCommandRepository(
	prisma: Pick<DatabaseClient, "note">,
) {
	async function create(data: UnexportedNote): Promise<void> {
		await withPersistenceErrors(async () => {
			await prisma.note.create({ data });
		});
	}

	async function deleteById(
		id: Id,
		userId: UserId,
		status: Status,
	): Promise<DeleteNoteResult> {
		return await withPersistenceErrors(async () => {
			const data = await prisma.note.delete({
				where: { id, userId, status },
				select: { title: true },
			});

			return { title: makeNoteTitle(data.title) };
		});
	}

	const notesCommandRepository: INotesCommandRepository = {
		create,
		deleteById,
	};

	return notesCommandRepository;
}

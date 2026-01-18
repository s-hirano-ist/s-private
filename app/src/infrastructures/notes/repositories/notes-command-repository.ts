import type {
	Id,
	Status,
	UserId,
} from "@s-hirano-ist/s-core/common/entities/common-entity";
import type { UnexportedNote } from "@s-hirano-ist/s-core/notes/entities/note-entity";
import type {
	DeleteNoteResult,
	INotesCommandRepository,
} from "@s-hirano-ist/s-core/notes/repositories/notes-command-repository.interface";
import prisma from "@/prisma";

async function create(data: UnexportedNote): Promise<void> {
	await prisma.note.create({ data });
}

async function deleteById(
	id: Id,
	userId: UserId,
	status: Status,
): Promise<DeleteNoteResult> {
	const data = await prisma.note.delete({
		where: { id, userId, status },
		select: { title: true },
	});
	return { title: data.title };
}

export const notesCommandRepository: INotesCommandRepository = {
	create,
	deleteById,
};

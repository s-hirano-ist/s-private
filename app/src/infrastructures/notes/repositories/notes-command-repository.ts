import type { UnexportedNote } from "@s-hirano-ist/s-core/notes/entities/note-entity";
import type {
	DeleteNoteResult,
	INotesCommandRepository,
} from "@s-hirano-ist/s-core/notes/repositories/notes-command-repository.interface";
import type {
	Id,
	Status,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { revalidateTag } from "next/cache";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/infrastructures/common/cache/cache-tag-builder";
import prisma from "@/prisma";

async function create(data: UnexportedNote): Promise<void> {
	await prisma.note.create({ data });

	revalidateTag(buildContentCacheTag("notes", data.status, data.userId));
	revalidateTag(buildCountCacheTag("notes", data.status, data.userId));
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

	revalidateTag(buildContentCacheTag("notes", status, userId));
	revalidateTag(buildCountCacheTag("notes", status, userId));

	return { title: data.title };
}

export const notesCommandRepository: INotesCommandRepository = {
	create,
	deleteById,
};

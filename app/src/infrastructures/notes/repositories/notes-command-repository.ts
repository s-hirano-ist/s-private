import {
	makeNoteTitle,
	type UnexportedNote,
} from "@s-hirano-ist/s-core/notes/entities/note-entity";
import type {
	DeleteNoteResult,
	INotesCommandRepository,
} from "@s-hirano-ist/s-core/notes/repositories/notes-command-repository.interface";
import type {
	Id,
	Status,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { updateTag } from "next/cache";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";
import prisma from "@/prisma";

async function create(data: UnexportedNote): Promise<void> {
	await prisma.note.create({ data });

	updateTag(buildContentCacheTag("notes", data.status, data.userId));
	updateTag(buildCountCacheTag("notes", data.status, data.userId));
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

	updateTag(buildContentCacheTag("notes", status, userId));
	updateTag(buildCountCacheTag("notes", status, userId));

	return { title: makeNoteTitle(data.title) };
}

export const notesCommandRepository: INotesCommandRepository = {
	create,
	deleteById,
};

import {
	type ExportedNote,
	makeMarkdown,
	makeNoteTitle,
	type NoteListItemDTO,
	type NoteSearchItemDTO,
	type NoteTitle,
	type UnexportedNote,
} from "@s-hirano-ist/s-core/notes/entities/note-entity";
import type {
	INotesQueryRepository,
	NotesFindManyParams,
} from "@s-hirano-ist/s-core/notes/repositories/notes-query-repository.interface";
import {
	makeCreatedAt,
	makeExportedAt,
	makeId,
	makeUserId,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import prisma from "@/prisma";

async function findByTitle(
	title: NoteTitle,
	userId: UserId,
): Promise<UnexportedNote | ExportedNote | null> {
	const data = await prisma.note.findUnique({
		where: { title_userId: { title, userId } },
		select: {
			id: true,
			userId: true,
			title: true,
			markdown: true,
			status: true,
			createdAt: true,
			exportedAt: true,
		},
	});
	if (!data) return null;

	const base = {
		id: makeId(data.id),
		userId: makeUserId(data.userId),
		title: makeNoteTitle(data.title),
		markdown: makeMarkdown(data.markdown),
		createdAt: makeCreatedAt(data.createdAt),
	};

	if (data.status === "EXPORTED" && data.exportedAt) {
		return Object.freeze({
			...base,
			status: "EXPORTED" as const,
			exportedAt: makeExportedAt(data.exportedAt),
		});
	}
	return Object.freeze({ ...base, status: "UNEXPORTED" as const });
}

async function findMany(
	userId: UserId,
	status: Status,
	params: NotesFindManyParams,
): Promise<NoteListItemDTO[]> {
	const data = await prisma.note.findMany({
		where: { userId, status },
		select: { id: true, title: true },
		...params,
	});
	return data.map((d) => ({
		id: makeId(d.id),
		title: makeNoteTitle(d.title),
	}));
}

async function count(userId: UserId, status: Status): Promise<number> {
	const data = await prisma.note.count({ where: { userId, status } });
	return data;
}

async function search(
	query: string,
	userId: UserId,
	limit = 20,
): Promise<NoteSearchItemDTO[]> {
	const data = await prisma.note.findMany({
		where: {
			userId,
			status: "EXPORTED",
			OR: [
				{ title: { contains: query, mode: "insensitive" } },
				{ markdown: { contains: query, mode: "insensitive" } },
			],
		},
		select: {
			id: true,
			title: true,
			markdown: true,
		},
		take: limit,
		orderBy: { createdAt: "desc" },
	});
	return data.map((d) => ({
		id: makeId(d.id),
		title: makeNoteTitle(d.title),
		markdown: makeMarkdown(d.markdown),
	}));
}

export const notesQueryRepository: INotesQueryRepository = {
	findByTitle,
	findMany,
	count,
	search,
};

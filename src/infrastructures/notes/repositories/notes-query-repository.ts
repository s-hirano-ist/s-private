import type { Status, UserId } from "@/domains/common/entities/common-entity";
import type { NoteTitle } from "@/domains/notes/entities/note-entity";
import type { INotesQueryRepository } from "@/domains/notes/repositories/notes-query-repository.interface";
import type { NotesFindManyParams } from "@/domains/notes/types/query-params";
import prisma from "@/prisma";

async function findByTitle(
	title: NoteTitle,
	userId: UserId,
): Promise<{ id: string; title: string; markdown: string } | null> {
	const data = await prisma.note.findUnique({
		where: { title_userId: { title, userId } },
		select: { id: true, title: true, markdown: true },
	});
	return data;
}

async function findMany(
	userId: UserId,
	status: Status,
	params: NotesFindManyParams,
): Promise<Array<{ id: string; title: string }>> {
	const data = await prisma.note.findMany({
		where: { userId, status },
		select: { id: true, title: true },
		...params,
	});
	return data;
}

async function count(userId: UserId, status: Status): Promise<number> {
	const data = await prisma.note.count({ where: { userId, status } });
	return data;
}

async function search(
	query: string,
	userId: UserId,
	limit = 20,
): Promise<
	{
		id: string;
		title: string;
		markdown: string;
	}[]
> {
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
	return data;
}

export const notesQueryRepository: INotesQueryRepository = {
	findByTitle,
	findMany,
	count,
	search,
};

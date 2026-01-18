import type { UnexportedBook } from "@s-hirano-ist/s-core/books/entities/books-entity";
import type {
	DeleteBookResult,
	IBooksCommandRepository,
} from "@s-hirano-ist/s-core/books/repositories/books-command-repository.interface";
import type {
	Id,
	Status,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import prisma from "@/prisma";

async function create(data: UnexportedBook): Promise<void> {
	await prisma.book.create({ data });
}

async function deleteById(
	id: Id,
	userId: UserId,
	status: Status,
): Promise<DeleteBookResult> {
	const data = await prisma.book.delete({
		where: { id, userId, status },
		select: { title: true },
	});
	return { title: data.title };
}

export const booksCommandRepository: IBooksCommandRepository = {
	create,
	deleteById,
};

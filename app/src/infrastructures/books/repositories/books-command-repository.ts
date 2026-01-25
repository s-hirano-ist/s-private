import type { UnexportedBook } from "@s-hirano-ist/s-core/books/entities/book-entity";
import type {
	DeleteBookResult,
	IBooksCommandRepository,
} from "@s-hirano-ist/s-core/books/repositories/books-command-repository.interface";
import type {
	Id,
	Status,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { revalidateTag } from "next/cache";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";
import prisma from "@/prisma";

async function create(data: UnexportedBook): Promise<void> {
	await prisma.book.create({ data });

	revalidateTag(buildContentCacheTag("books", data.status, data.userId));
	revalidateTag(buildCountCacheTag("books", data.status, data.userId));
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

	revalidateTag(buildContentCacheTag("books", status, userId));
	revalidateTag(buildCountCacheTag("books", status, userId));

	return { title: data.title };
}

export const booksCommandRepository: IBooksCommandRepository = {
	create,
	deleteById,
};

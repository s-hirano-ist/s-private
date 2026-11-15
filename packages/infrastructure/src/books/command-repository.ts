import type {
	DeleteBookResult,
	IBooksCommandRepository,
} from "@s-hirano-ist/s-core/books/repositories/books-command-repository.interface";
import type {
	Id,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import {
	makeBookTitle,
	type UnexportedBook,
} from "@s-hirano-ist/s-core/books/entities/book-entity";
import { withPersistenceErrors } from "@s-hirano-ist/s-infrastructure/persistence-errors";

export function createBooksCommandRepository(
	prisma: Pick<DatabaseClient, "book">,
) {
	async function create(data: UnexportedBook): Promise<void> {
		await withPersistenceErrors(async () => {
			await prisma.book.create({ data });
		});
	}

	async function deleteById(id: Id, userId: UserId): Promise<DeleteBookResult> {
		return await withPersistenceErrors(async () => {
			const data = await prisma.book.delete({
				where: { id, userId },
				select: { title: true, imagePath: true },
			});

			return { title: makeBookTitle(data.title), imagePath: data.imagePath };
		});
	}

	const booksCommandRepository: IBooksCommandRepository = {
		create,
		deleteById,
	};

	return booksCommandRepository;
}

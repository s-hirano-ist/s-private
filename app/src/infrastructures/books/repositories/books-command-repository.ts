import type { UnexportedBook } from "@s-hirano-ist/s-core/books/entities/books-entity";
import { BookCreatedEvent } from "@s-hirano-ist/s-core/books/events/book-created-event";
import { BookDeletedEvent } from "@s-hirano-ist/s-core/books/events/book-deleted-event";
import type { IBooksCommandRepository } from "@s-hirano-ist/s-core/books/repositories/books-command-repository.interface";
import type {
	Id,
	Status,
	UserId,
} from "@s-hirano-ist/s-core/common/entities/common-entity";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";
import prisma from "@/prisma";

initializeEventHandlers();

async function create(data: UnexportedBook) {
	const response = await prisma.book.create({
		data,
		select: { ISBN: true, title: true, userId: true },
	});
	await eventDispatcher.dispatch(
		new BookCreatedEvent({
			ISBN: response.ISBN,
			title: response.title,
			userId: response.userId,
			caller: "addBooks",
		}),
	);
}

async function deleteById(id: Id, userId: UserId, status: Status) {
	const data = await prisma.book.delete({
		where: { id, userId, status },
		select: { title: true },
	});
	await eventDispatcher.dispatch(
		new BookDeletedEvent({
			title: data.title,
			userId,
			caller: "deleteBooks",
		}),
	);
}

export const booksCommandRepository: IBooksCommandRepository = {
	create,
	deleteById,
};

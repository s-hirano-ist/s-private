import type {
	ISBN,
	UnexportedBook,
} from "@s-hirano-ist/s-core/books/entities/books-entity";
import { BookCreatedEvent } from "@s-hirano-ist/s-core/books/events/book-created-event";
import { BookDeletedEvent } from "@s-hirano-ist/s-core/books/events/book-deleted-event";
import { BookUpdatedEvent } from "@s-hirano-ist/s-core/books/events/book-updated-event";
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

async function update(ISBN: ISBN, userId: UserId, data: UnexportedBook) {
	const response = await prisma.book.update({
		where: { ISBN_userId: { ISBN, userId } },
		data,
		select: { ISBN: true, title: true, userId: true },
	});
	await eventDispatcher.dispatch(
		new BookUpdatedEvent({
			ISBN: response.ISBN,
			title: response.title,
			userId: response.userId,
			caller: "updateBook",
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

async function fetchBookFromGitHub(): Promise<UnexportedBook[]> {
	const url =
		"https://raw.githubusercontent.com/s-hirano-ist/s-public/main/src/data/book/data.gen.json";
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch book data: ${response.statusText}`);
		}
		const data = await response.json();
		return data as UnexportedBook[];
	} catch (error) {
		console.error("Error fetching book data:", error);
		throw error;
	}
}

export const booksCommandRepository: IBooksCommandRepository = {
	create,
	update,
	deleteById,
	fetchBookFromGitHub,
};

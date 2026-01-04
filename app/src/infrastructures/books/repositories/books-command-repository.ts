import type { UnexportedBook } from "@s-hirano-ist/s-core/books/entities/books-entity";
import { BookCreatedEvent } from "@s-hirano-ist/s-core/books/events/book-created-event";
import { BookDeletedEvent } from "@s-hirano-ist/s-core/books/events/book-deleted-event";
import type { IBooksCommandRepository } from "@s-hirano-ist/s-core/books/repositories/books-command-repository.interface";
import type {
	Id,
	Status,
	UserId,
} from "@s-hirano-ist/s-core/common/entities/common-entity";
import type { Path } from "@s-hirano-ist/s-core/images/entities/image-entity";
import { env } from "@/env";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";
import { minioClient } from "@/minio";
import prisma from "@/prisma";
import { ORIGINAL_BOOK_IMAGE_PATH, THUMBNAIL_BOOK_IMAGE_PATH } from "./common";

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

async function uploadImageToStorage(
	path: Path,
	buffer: Buffer,
	isThumbnail: boolean,
): Promise<void> {
	const objKey = `${isThumbnail ? THUMBNAIL_BOOK_IMAGE_PATH : ORIGINAL_BOOK_IMAGE_PATH}/${path}`;
	await minioClient.putObject(env.MINIO_BUCKET_NAME, objKey, buffer);
}

export const booksCommandRepository: IBooksCommandRepository = {
	create,
	deleteById,
	fetchBookFromGitHub,
	uploadImageToStorage,
};

"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	type BooksDomainServiceDeps,
	booksDomainOperations,
} from "@/domains/books/services/books-domain-service";
import { BookTitle, ISBN } from "@/domains/books/value-objects";
import { DomainEventFactory, EventPublisher } from "@/domains/common/events";
import { Result } from "@/domains/common/value-objects";
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";

export async function addBooks(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	const userId = await getSelfId();

	// Create dependencies for functional approach
	const deps: BooksDomainServiceDeps = {
		booksQueryRepository,
		booksCommandRepository,
	};

	// Use the functional domain operations
	const bookResult = await booksDomainOperations.validateNewBook(
		formData,
		userId,
		deps,
	);

	if (bookResult.isFailure) {
		return await wrapServerSideErrorForClient(bookResult, formData);
	}

	const book = bookResult.value;

	// Save the book using functional repository
	const saveResult = await booksCommandRepository.save(book);

	if (saveResult.isFailure) {
		return await wrapServerSideErrorForClient(saveResult, formData);
	}

	// Publish domain event
	const bookCreatedEvent = DomainEventFactory.bookCreated(book.id, userId, {
		isbn: ISBN.unwrap(book.isbn),
		title: BookTitle.unwrap(book.title),
	});

	await EventPublisher.publish(bookCreatedEvent);

	// Revalidate cache
	revalidateTag(`books_UNEXPORTED_${userId}`);
	revalidateTag(`books_count_UNEXPORTED_${userId}`);

	return { success: true, message: "inserted" };
}

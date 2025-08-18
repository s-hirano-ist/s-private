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
import { pipe, Result } from "@/domains/common/value-objects";
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";

// Functional approach using the new domain model
export async function addBooksFunctional(
	formData: FormData,
): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		// Create dependencies for the domain service
		const deps: BooksDomainServiceDeps = {
			booksQueryRepository,
		};

		// Use the functional domain operations
		const bookResult = await booksDomainOperations.validateNewBook(
			formData,
			userId,
			deps,
		);

		if (bookResult.isFailure) {
			// Convert domain errors to server action format
			return {
				success: false,
				message: bookResult.error.message,
				errors: [
					{
						field: bookResult.error.field || "general",
						message: bookResult.error.message,
					},
				],
			};
		}

		const book = bookResult.value;

		// Convert to legacy format for repository
		const legacyBookData = {
			ISBN: ISBN.unwrap(book.isbn),
			title: BookTitle.unwrap(book.title),
			userId: book.userId,
			id: book.id,
			status: book.status,
		};

		// Save to repository
		await booksCommandRepository.create(legacyBookData);

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
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}

// Pipeline-based approach for demonstration
export async function addBooksWithPipeline(
	formData: FormData,
): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	const userId = await getSelfId();
	const deps: BooksDomainServiceDeps = { booksQueryRepository };

	const result = await pipe(formData)(
		async (data) =>
			await booksDomainOperations.validateNewBook(data, userId, deps),
	).then(async (bookResult) => {
		if (bookResult.isFailure) {
			return Result.failure(bookResult.error);
		}

		const book = bookResult.value;

		// Convert and save
		const legacyBookData = {
			ISBN: ISBN.unwrap(book.isbn),
			title: BookTitle.unwrap(book.title),
			userId: book.userId,
			id: book.id,
			status: book.status,
		};

		await booksCommandRepository.create(legacyBookData);

		// Publish event
		const event = DomainEventFactory.bookCreated(book.id, userId, {
			isbn: ISBN.unwrap(book.isbn),
			title: BookTitle.unwrap(book.title),
		});
		await EventPublisher.publish(event);

		// Revalidate cache
		revalidateTag(`books_UNEXPORTED_${userId}`);
		revalidateTag(`books_count_UNEXPORTED_${userId}`);

		return Result.success(book);
	});

	if (result.isFailure) {
		return {
			success: false,
			message: result.error.message,
			errors: [
				{
					field: result.error.field || "general",
					message: result.error.message,
				},
			],
		};
	}

	return { success: true, message: "inserted" };
}

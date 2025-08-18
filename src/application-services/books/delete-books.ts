"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import type { BookId } from "@/domains/books/entities/books-entity";
import { DomainEventFactory, EventPublisher } from "@/domains/common/events";
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";

export async function deleteBooks(id: BookId): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	const userId = await getSelfId();

	// Use functional repository
	const deleteResult = await booksCommandRepository.delete(
		id,
		userId,
		"UNEXPORTED",
	);

	if (deleteResult.isFailure) {
		return await wrapServerSideErrorForClient(deleteResult);
	}

	// Publish domain event
	const bookDeletedEvent = DomainEventFactory.bookStatusChanged(id, userId, {
		oldStatus: "UNEXPORTED",
		newStatus: "EXPORTED", // Conceptually moving to deleted state
	});

	await EventPublisher.publish(bookDeletedEvent);

	// Revalidate cache
	revalidateTag(`books_UNEXPORTED_${userId}`);
	revalidateTag(`books_count_UNEXPORTED_${userId}`);

	return { success: true, message: "deleted" };
}

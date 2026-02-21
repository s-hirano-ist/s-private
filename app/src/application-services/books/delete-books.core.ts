/**
 * Core business logic for book deletion.
 *
 * @remarks
 * NOT a Server Action - for internal use and testing only.
 *
 * @module
 */

import "server-only";
import { BookDeletedEvent } from "@s-hirano-ist/s-core/books/events/book-deleted-event";
import {
	type Id,
	makeUnexportedStatus,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import type { DeleteBooksDeps } from "./delete-books.deps";

/**
 * Core business logic for deleting a book.
 *
 * @remarks
 * This function contains the pure business logic without authentication/authorization.
 * It is designed to be easily testable by accepting dependencies as parameters.
 *
 * Only unexported books can be deleted.
 *
 * @param id - Validated Book ID to delete
 * @param deps - Dependencies (repository, event dispatcher)
 * @returns Server action result with success/failure status
 */
export async function deleteBooksCore(
	id: Id,
	deps: DeleteBooksDeps,
): Promise<ServerAction> {
	const { commandRepository, eventDispatcher } = deps;

	try {
		const userId = await getSelfId();

		const status = makeUnexportedStatus();
		// Cache invalidation is handled in repository
		const { title } = await commandRepository.deleteById(id, userId, status);

		// Dispatch domain event
		await eventDispatcher.dispatch(
			new BookDeletedEvent({
				title,
				userId: userId as string,
				caller: "deleteBooks",
			}),
		);

		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
